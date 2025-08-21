from django.core.management.base import BaseCommand
from games.models import Game
from django.db.models import Count, Avg, Q
import json

class Command(BaseCommand):
    help = 'Display database statistics'

    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("[DB STATS] GameSub Database Statistics")
        self.stdout.write("="*60)
        
        # Basic counts
        total_games = Game.objects.count()
        games_with_embeddings = Game.objects.filter(embedding__isnull=False).count()
        games_without_embeddings = total_games - games_with_embeddings
        
        self.stdout.write(f"\n[GAMES] Total games: {total_games}")
        self.stdout.write(f"[EMBEDDINGS] With embeddings: {games_with_embeddings}")
        self.stdout.write(f"[EMBEDDINGS] Without embeddings: {games_without_embeddings}")
        
        if total_games > 0:
            embedding_percentage = (games_with_embeddings / total_games) * 100
            self.stdout.write(f"[EMBEDDINGS] Coverage: {embedding_percentage:.1f}%")
        
        # Rating statistics
        rating_stats = Game.objects.aggregate(
            avg_rating=Avg('rating'),
            avg_metacritic=Avg('metacritic')
        )
        
        if rating_stats['avg_rating']:
            self.stdout.write(f"\n[QUALITY] Average rating: {rating_stats['avg_rating']:.2f}")
        if rating_stats['avg_metacritic']:
            self.stdout.write(f"[QUALITY] Average metacritic: {rating_stats['avg_metacritic']:.1f}")
        
        # Top genres
        self.stdout.write(f"\n[GENRES] Top 10 genres:")
        genre_counts = {}
        
        for game in Game.objects.exclude(genres__isnull=True).exclude(genres=''):
            if game.genres:
                try:
                    if isinstance(game.genres, str):
                        genres = json.loads(game.genres)
                    else:
                        genres = game.genres
                    
                    for genre in genres:
                        if isinstance(genre, dict) and 'name' in genre:
                            genre_name = genre['name']
                            genre_counts[genre_name] = genre_counts.get(genre_name, 0) + 1
                except:
                    continue
        
        for genre, count in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            self.stdout.write(f"   {genre}: {count} games")
        
        # Recent games
        recent_games = Game.objects.filter(
            released__year__gte=2020
        ).count()
        
        self.stdout.write(f"\n[RECENCY] Games from 2020+: {recent_games}")
        
        # High-quality games
        high_quality = Game.objects.filter(
            Q(rating__gte=4.0) | Q(metacritic__gte=80)
        ).count()
        
        self.stdout.write(f"[QUALITY] High-quality games (rating >= 4.0 or metacritic >= 80): {high_quality}")
        
        # Latest additions
        latest_games = Game.objects.order_by('-id')[:5]
        self.stdout.write(f"\n[RECENT] Latest 5 games added:")
        for game in latest_games:
            rating_info = f" (★{game.rating:.1f})" if game.rating else ""
            metacritic_info = f" [M{game.metacritic}]" if game.metacritic else ""
            self.stdout.write(f"   {game.name}{rating_info}{metacritic_info}")
        
        self.stdout.write("\n" + "="*60)