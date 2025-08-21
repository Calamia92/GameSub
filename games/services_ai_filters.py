"""
Services pour les filtres IA adaptatifs - Révolution UX GameSub
Transforme les filtres techniques en filtres humains naturels
"""

from typing import Dict, List, Any, Optional
import logging
from .services_semantic_search import semantic_search_games
from .models import Game

logger = logging.getLogger(__name__)

# 🎯 Mappings sémantiques : Du humain vers le technique
SEMANTIC_MAPPINGS = {
    # 🎭 AMBIANCE - Comment le jeu vous fait vous sentir
    'relaxing': {
        'boost_keywords': ['zen', 'peaceful', 'calm', 'meditative', 'cozy', 'chill', 'atmospheric', 'beautiful'],
        'preferred_genres': ['simulation', 'puzzle', 'casual', 'adventure'],
        'preferred_tags': ['relaxing', 'atmospheric', 'beautiful', 'exploration', 'nature'],
        'exclude_keywords': ['horror', 'violent', 'stressful', 'competitive', 'fast-paced'],
        'playtime_bonus': {'min': 0, 'max': 100},  # Favorise jeux pas trop longs
        'score_multiplier': 1.4
    },
    
    'intense': {
        'boost_keywords': ['action', 'fast-paced', 'adrenaline', 'combat', 'intense', 'thrilling'],
        'preferred_genres': ['action', 'shooter', 'fighting', 'racing'],
        'preferred_tags': ['fast-paced', 'action', 'combat', 'competitive'],
        'exclude_keywords': ['slow', 'turn-based', 'relaxing', 'peaceful'],
        'score_multiplier': 1.3
    },
    
    'mysterious': {
        'boost_keywords': ['mystery', 'investigation', 'detective', 'puzzle', 'enigma', 'secret'],
        'preferred_genres': ['adventure', 'puzzle', 'mystery'],
        'preferred_tags': ['mystery', 'investigation', 'atmospheric', 'story'],
        'score_multiplier': 1.3
    },
    
    'epic': {
        'boost_keywords': ['epic', 'grand', 'massive', 'legendary', 'hero', 'adventure', 'fantasy'],
        'preferred_genres': ['rpg', 'action-adventure', 'strategy'],
        'preferred_tags': ['epic', 'fantasy', 'adventure', 'story-rich'],
        'playtime_bonus': {'min': 20, 'max': 500},  # Favorise les longs jeux
        'score_multiplier': 1.4
    },
    
    'funny': {
        'boost_keywords': ['funny', 'humor', 'comedy', 'silly', 'parody', 'cartoon'],
        'preferred_genres': ['comedy', 'casual', 'party'],
        'preferred_tags': ['funny', 'comedy', 'humor', 'family-friendly'],
        'score_multiplier': 1.3
    },
    
    # ⚡ ENGAGEMENT - Type d'expérience recherchée
    'casual': {
        'boost_keywords': ['easy', 'accessible', 'family-friendly', 'simple', 'casual'],
        'preferred_genres': ['casual', 'puzzle', 'simulation'],
        'preferred_tags': ['casual', 'easy', 'family-friendly'],
        'playtime_bonus': {'min': 0, 'max': 50},
        'exclude_keywords': ['complex', 'hardcore', 'punishing', 'difficult'],
        'score_multiplier': 1.3
    },
    
    'story': {
        'boost_keywords': ['narrative', 'story', 'character', 'dialogue', 'plot', 'cinematic'],
        'preferred_genres': ['rpg', 'adventure', 'visual-novel'],
        'preferred_tags': ['story-rich', 'narrative', 'character-driven'],
        'playtime_bonus': {'min': 8, 'max': 200},
        'score_multiplier': 1.5
    },
    
    'hardcore': {
        'boost_keywords': ['challenging', 'difficult', 'complex', 'hardcore', 'skill-based'],
        'preferred_genres': ['strategy', 'simulation', 'rpg'],
        'preferred_tags': ['difficult', 'complex', 'challenging'],
        'exclude_keywords': ['easy', 'casual', 'simple'],
        'score_multiplier': 1.4
    },
    
    # ⏰ DURÉE DE SESSION
    'short_session': {
        'boost_keywords': ['quick', 'short', 'bite-sized', 'mobile'],
        'preferred_genres': ['arcade', 'puzzle', 'casual'],
        'playtime_bonus': {'min': 0, 'max': 20},
        'exclude_keywords': ['long', 'epic', 'extensive'],
        'score_multiplier': 1.3
    },
    
    'medium_session': {
        'boost_keywords': ['medium', 'moderate'],
        'playtime_bonus': {'min': 10, 'max': 80},
        'score_multiplier': 1.2
    },
    
    'long_session': {
        'boost_keywords': ['epic', 'extensive', 'long', 'massive', 'endless'],
        'preferred_genres': ['rpg', 'strategy', 'simulation'],
        'playtime_bonus': {'min': 30, 'max': 500},
        'score_multiplier': 1.4
    },
    
    # 👥 ASPECT SOCIAL
    'solo': {
        'boost_keywords': ['single-player', 'solo', 'offline'],
        'preferred_tags': ['single-player', 'solo'],
        'exclude_keywords': ['multiplayer', 'online', 'coop'],
        'score_multiplier': 1.3
    },
    
    'coop': {
        'boost_keywords': ['cooperative', 'coop', 'team', 'friends'],
        'preferred_tags': ['co-op', 'cooperative', 'multiplayer'],
        'exclude_keywords': ['single-player', 'solo'],
        'score_multiplier': 1.4
    },
    
    'competitive': {
        'boost_keywords': ['competitive', 'pvp', 'versus', 'ranked', 'esports'],
        'preferred_genres': ['fighting', 'shooter', 'moba', 'racing'],
        'preferred_tags': ['competitive', 'pvp', 'multiplayer'],
        'score_multiplier': 1.3
    },
    
    # 🎯 DIFFICULTÉ
    'accessible': {
        'boost_keywords': ['easy', 'beginner', 'accessible', 'user-friendly'],
        'preferred_tags': ['easy', 'beginner-friendly'],
        'exclude_keywords': ['difficult', 'punishing', 'hardcore'],
        'score_multiplier': 1.3
    },
    
    'challenging': {
        'boost_keywords': ['challenging', 'difficult', 'demanding'],
        'preferred_tags': ['difficult', 'challenging'],
        'exclude_keywords': ['easy', 'casual'],
        'score_multiplier': 1.3
    },
    
    'punishing': {
        'boost_keywords': ['punishing', 'brutal', 'unforgiving', 'souls-like'],
        'preferred_tags': ['difficult', 'punishing', 'souls-like'],
        'exclude_keywords': ['easy', 'forgiving'],
        'score_multiplier': 1.4
    }
}


def enhance_query_with_ai_filters(query: str, ai_filters: Dict[str, str]) -> str:
    """
    Enrichit la requête utilisateur avec les mots-clés des filtres IA
    
    Args:
        query: Requête originale ("jeux comme Zelda")
        ai_filters: {"ambiance": "relaxing", "engagement": "story"}
    
    Returns:
        Requête enrichie avec mots-clés sémantiques
    """
    enhanced_query = query
    boost_terms = []
    
    for filter_type, filter_value in ai_filters.items():
        if filter_value and filter_value in SEMANTIC_MAPPINGS:
            mapping = SEMANTIC_MAPPINGS[filter_value]
            boost_terms.extend(mapping.get('boost_keywords', []))
    
    if boost_terms:
        # Ajouter les termes de boost à la requête
        enhanced_query += f" {' '.join(set(boost_terms))}"
    
    logger.info(f"[AI FILTERS] Requête enrichie: '{enhanced_query}'")
    return enhanced_query


def calculate_ai_filter_score(game: Game, ai_filters: Dict[str, str]) -> float:
    """
    Calcule un score de pertinence pour un jeu selon les filtres IA
    
    Args:
        game: Instance du jeu
        ai_filters: Filtres IA sélectionnés
    
    Returns:
        Score multiplié (1.0 = neutre, >1.0 = bonus, <1.0 = malus)
    """
    total_multiplier = 1.0
    
    # Préparer les données du jeu pour l'analyse
    game_text = f"{game.name} {game.description or ''}".lower()
    game_genres = [str(g).lower() if isinstance(g, str) else g.get('name', '').lower() 
                   for g in (game.genres or [])]
    game_tags = [str(t).lower() if isinstance(t, str) else t.get('name', '').lower() 
                 for t in (game.tags or [])]
    
    for filter_type, filter_value in ai_filters.items():
        if not filter_value or filter_value not in SEMANTIC_MAPPINGS:
            continue
            
        mapping = SEMANTIC_MAPPINGS[filter_value]
        filter_multiplier = 1.0
        
        # 1. Vérifier les mots-clés de boost
        boost_keywords = mapping.get('boost_keywords', [])
        boost_matches = sum(1 for keyword in boost_keywords if keyword in game_text)
        if boost_matches > 0:
            filter_multiplier *= (1.0 + boost_matches * 0.1)  # +10% par mot-clé trouvé
        
        # 2. Vérifier les genres préférés
        preferred_genres = mapping.get('preferred_genres', [])
        genre_matches = sum(1 for genre in preferred_genres if genre in game_genres)
        if genre_matches > 0:
            filter_multiplier *= (1.0 + genre_matches * 0.15)  # +15% par genre matchant
        
        # 3. Vérifier les tags préférés
        preferred_tags = mapping.get('preferred_tags', [])
        tag_matches = sum(1 for tag in preferred_tags if tag in game_tags)
        if tag_matches > 0:
            filter_multiplier *= (1.0 + tag_matches * 0.1)  # +10% par tag matchant
        
        # 4. Vérifier les mots-clés d'exclusion
        exclude_keywords = mapping.get('exclude_keywords', [])
        exclude_matches = sum(1 for keyword in exclude_keywords if keyword in game_text)
        if exclude_matches > 0:
            filter_multiplier *= (0.9 ** exclude_matches)  # -10% par mot d'exclusion
        
        # 5. Bonus playtime
        playtime_bonus = mapping.get('playtime_bonus', {})
        if playtime_bonus and game.playtime:
            min_time = playtime_bonus.get('min', 0)
            max_time = playtime_bonus.get('max', 1000)
            if min_time <= game.playtime <= max_time:
                filter_multiplier *= 1.2  # +20% si dans la bonne fourchette
            elif game.playtime < min_time or game.playtime > max_time:
                filter_multiplier *= 0.8  # -20% si hors fourchette
        
        # 6. Appliquer le multiplicateur base du filtre
        base_multiplier = mapping.get('score_multiplier', 1.0)
        filter_multiplier *= base_multiplier
        
        total_multiplier *= filter_multiplier
    
    # Limiter les valeurs extrêmes
    total_multiplier = max(0.1, min(3.0, total_multiplier))
    
    logger.debug(f"[AI FILTERS] {game.name}: score multiplier = {total_multiplier:.2f}")
    return total_multiplier


def ai_search_with_adaptive_filters(
    query: str, 
    ai_filters: Dict[str, str], 
    limit: int = 20,
    min_similarity: float = 0.3
) -> List[Dict]:
    """
    Recherche sémantique avec filtres IA adaptatifs
    
    Args:
        query: Requête utilisateur
        ai_filters: Dictionnaire des filtres IA sélectionnés
        limit: Nombre de résultats à retourner
        min_similarity: Score minimum après filtrage
    
    Returns:
        Liste de jeux avec scores ajustés
    """
    logger.info(f"[AI SEARCH] Requête: '{query}' avec filtres: {ai_filters}")
    
    # 1. Enrichir la requête avec les mots-clés des filtres
    enhanced_query = enhance_query_with_ai_filters(query, ai_filters)
    
    # 2. Recherche sémantique standard (récupérer plus de résultats pour filtrage)
    search_limit = min(limit * 3, 60)  # Chercher 3x plus pour avoir de la marge
    semantic_results = semantic_search_games(enhanced_query, search_limit, min_similarity=0.2)
    
    if not semantic_results:
        logger.warning("[AI SEARCH] Aucun résultat de la recherche sémantique")
        return []
    
    # 3. Appliquer les filtres IA et recalculer les scores
    filtered_results = []
    for result in semantic_results:
        try:
            game_id = result.get('id')
            game = Game.objects.get(id=game_id)
            
            # Calculer le multiplicateur IA
            ai_multiplier = calculate_ai_filter_score(game, ai_filters)
            
            # Nouveau score = score sémantique × multiplicateur IA
            original_score = result.get('similarity_score', 0.5)
            new_score = original_score * ai_multiplier
            
            # Filtrer si score trop bas
            if new_score >= min_similarity:
                result['ai_filtered_score'] = new_score
                result['ai_multiplier'] = ai_multiplier
                result['original_score'] = original_score
                filtered_results.append(result)
                
        except Game.DoesNotExist:
            logger.warning(f"[AI SEARCH] Jeu {game_id} introuvable")
            continue
        except Exception as e:
            logger.error(f"[AI SEARCH] Erreur traitement jeu {game_id}: {e}")
            continue
    
    # 4. Trier par nouveau score et limiter
    filtered_results.sort(key=lambda x: x['ai_filtered_score'], reverse=True)
    final_results = filtered_results[:limit]
    
    logger.info(f"[AI SEARCH] {len(final_results)} résultats après filtrage IA")
    
    return final_results


def get_ai_filter_options() -> Dict[str, List[Dict]]:
    """
    Retourne les options de filtres IA disponibles pour le frontend
    
    Returns:
        Dictionnaire structuré des options de filtres
    """
    return {
        'ambiance': [
            {'id': 'relaxing', 'label': '😌 Relaxant', 'description': 'Pour se détendre et décompresser'},
            {'id': 'intense', 'label': '⚡ Intense', 'description': 'Action et adrénaline garanties'},
            {'id': 'mysterious', 'label': '🔮 Mystérieux', 'description': 'Énigmes et investigations'},
            {'id': 'epic', 'label': '🏰 Épique', 'description': 'Grandes aventures héroïques'},
            {'id': 'funny', 'label': '😄 Drôle', 'description': 'Humour et bonne humeur'}
        ],
        
        'engagement': [
            {'id': 'casual', 'label': '🎈 Casual', 'description': 'Facile à prendre en main'},
            {'id': 'story', 'label': '📖 Story-driven', 'description': 'Axé sur la narration'},
            {'id': 'hardcore', 'label': '🎯 Hardcore', 'description': 'Pour joueurs expérimentés'}
        ],
        
        'session': [
            {'id': 'short_session', 'label': '⏱️ Session courte', 'description': '15-60 minutes'},
            {'id': 'medium_session', 'label': '🕐 Séance moyenne', 'description': '1-3 heures'},
            {'id': 'long_session', 'label': '📅 Aventure longue', 'description': '10+ heures'}
        ],
        
        'social': [
            {'id': 'solo', 'label': '🧘 Solo', 'description': 'Expérience solo immersive'},
            {'id': 'coop', 'label': '🤝 Coopératif', 'description': 'Jouer entre amis'},
            {'id': 'competitive', 'label': '🏆 Compétitif', 'description': 'PvP et classements'}
        ],
        
        'difficulty': [
            {'id': 'accessible', 'label': '🟢 Accessible', 'description': 'Pour tous niveaux'},
            {'id': 'challenging', 'label': '🟡 Challengeant', 'description': 'Demande de la maîtrise'},
            {'id': 'punishing', 'label': '🔴 Punissant', 'description': 'Extremely difficult'}
        ]
    }