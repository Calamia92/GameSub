import requests
from django.conf import settings
from django.utils.text import slugify
from .models import Game
import logging


logger = logging.getLogger(__name__)


class RAWGAPIService:
    def __init__(self):
        self.api_key = settings.RAWG_API_KEY
        self.base_url = settings.RAWG_BASE_URL
        logger.info(f"RAWG API Key loaded: {self.api_key[:10]}..." if self.api_key else "No RAWG API Key")

    def _make_request(self, endpoint, params=None):
        if not params:
            params = {}
        
        params['key'] = self.api_key
        
        try:
            response = requests.get(f"{self.base_url}/{endpoint}", params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"RAWG API error: {e}")
            return None

    def search_games(self, query, page=1, page_size=20, genres=None, platforms=None, dates=None):
        params = {
            'search': query,
            'page': page,
            'page_size': page_size,
        }
        
        if genres:
            params['genres'] = genres
        if platforms:
            params['platforms'] = platforms
        if dates:
            params['dates'] = dates
            
        return self._make_request('games', params)

    def get_game_details(self, game_id):
        return self._make_request(f'games/{game_id}')

    def get_similar_games(self, game_id, page=1, page_size=10):
        return self._make_request(f'games/{game_id}/suggested', {'page': page, 'page_size': page_size})

    def get_genres(self):
        return self._make_request('genres')

    def get_platforms(self):
        return self._make_request('platforms')

    def save_game_to_db(self, game_data):
        try:
            # Vérifications de sécurité pour éviter les erreurs
            if not game_data or 'id' not in game_data:
                logger.error("Invalid game data: missing id")
                return None
                
            game, created = Game.objects.get_or_create(
                external_id=game_data['id'],
                defaults={
                    'name': game_data.get('name', ''),
                    'slug': game_data.get('slug', slugify(game_data.get('name', ''))),
                    'description': game_data.get('description_raw', ''),
                    'released': game_data.get('released'),
                    'rating': game_data.get('rating'),
                    'metacritic': game_data.get('metacritic'),
                    'playtime': game_data.get('playtime'),
                    'esrb_rating': game_data.get('esrb_rating', {}).get('name') if game_data.get('esrb_rating') else None,
                    'background_image': game_data.get('background_image'),
                    'website': game_data.get('website'),
                    'genres': [{'id': g['id'], 'name': g['name']} for g in game_data.get('genres', []) if g and 'id' in g and 'name' in g],
                    'platforms': [{'id': p['platform']['id'], 'name': p['platform']['name']} for p in game_data.get('platforms', []) if p and 'platform' in p],
                    'stores': [{'id': s['store']['id'], 'name': s['store']['name'], 'url': s.get('url')} for s in game_data.get('stores', []) if s and 'store' in s],
                    'tags': [{'id': t['id'], 'name': t['name']} for t in game_data.get('tags', []) if t and 'id' in t and 'name' in t]
                }
            )
            return game
        except Exception as e:
            logger.error(f"Error saving game to database: {e}")
            return None

    def find_substitutes(self, source_game_id, max_results=10):
        similar_games_data = self.get_similar_games(source_game_id, page_size=max_results)
        
        if not similar_games_data or 'results' not in similar_games_data:
            return []

        substitutes = []
        for game_data in similar_games_data['results']:
            game = self.save_game_to_db(game_data)
            if game:
                substitutes.append(game)
                
        return substitutes

    def calculate_similarity_score(self, source_game, substitute_game):
        score = 0.0
        
        source_genres = {g['name'] for g in source_game.genres}
        substitute_genres = {g['name'] for g in substitute_game.genres}
        genre_similarity = len(source_genres & substitute_genres) / max(len(source_genres | substitute_genres), 1)
        score += genre_similarity * 0.4
        
        source_tags = {t['name'] for t in source_game.tags[:10]}
        substitute_tags = {t['name'] for t in substitute_game.tags[:10]}
        tag_similarity = len(source_tags & substitute_tags) / max(len(source_tags | substitute_tags), 1)
        score += tag_similarity * 0.3
        
        if source_game.rating and substitute_game.rating:
            rating_diff = abs(source_game.rating - substitute_game.rating)
            rating_similarity = max(0, (5 - rating_diff) / 5)
            score += rating_similarity * 0.2
        
        if source_game.playtime and substitute_game.playtime:
            playtime_diff = abs(source_game.playtime - substitute_game.playtime)
            playtime_similarity = max(0, 1 - (playtime_diff / max(source_game.playtime, substitute_game.playtime)))
            score += playtime_similarity * 0.1
        
        return min(1.0, score)