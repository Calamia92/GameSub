import requests
import time
from django.core.management.base import BaseCommand
from django.db import transaction
from games.models import Game
from games.services import RAWGAPIService
import json
from datetime import datetime, date
from decouple import config
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Import popular and highly-rated games from RAWG API to populate the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10000,
            help='Number of games to import (default: 10000)'
        )
        parser.add_argument(
            '--strategy',
            type=str,
            choices=['popular', 'rated', 'recent', 'mixed'],
            default='mixed',
            help='Import strategy: popular (most downloaded), rated (highest metacritic), recent (newest), mixed (combination)'
        )
        parser.add_argument(
            '--min-rating',
            type=float,
            default=3.0,
            help='Minimum rating to import (default: 3.0)'
        )
        parser.add_argument(
            '--min-metacritic',
            type=int,
            default=60,
            help='Minimum metacritic score to import (default: 60)'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=20,
            help='Batch size for each API request (default: 20, max: 40)'
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=0.3,
            help='Delay between API requests in seconds (default: 0.3)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force reimport of existing games'
        )

    def handle(self, *args, **options):
        self.count = options['count']
        self.strategy = options['strategy']
        self.min_rating = options['min_rating']
        self.min_metacritic = options['min_metacritic']
        self.batch_size = min(options['batch_size'], 40)  # RAWG max is 40
        self.delay = options['delay']
        self.force = options['force']
        
        # Initialize RAWG service
        self.rawg_service = RAWGAPIService()
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\n[*] Starting import of {self.count} games with strategy '{self.strategy}'"
            )
        )
        self.stdout.write(f"[INFO] Filters: rating >= {self.min_rating}, metacritic >= {self.min_metacritic}")
        self.stdout.write(f"[CONFIG] Batch size: {self.batch_size}, delay: {self.delay}s")
        self.stdout.write("="*60)
        
        total_imported = 0
        total_skipped = 0
        total_errors = 0
        
        if self.strategy == 'mixed':
            # Import mix of popular, rated, and recent games
            strategies = [
                ('popular', int(self.count * 0.4)),
                ('rated', int(self.count * 0.4)), 
                ('recent', int(self.count * 0.2))
            ]
        else:
            strategies = [(self.strategy, self.count)]
        
        for strategy_name, strategy_count in strategies:
            self.stdout.write(f"\n[STRATEGY] Importing {strategy_count} {strategy_name} games...")
            
            imported, skipped, errors = self.import_with_strategy(strategy_name, strategy_count)
            total_imported += imported
            total_skipped += skipped
            total_errors += errors
            
            self.stdout.write(
                f"[OK] {strategy_name.capitalize()}: {imported} imported, {skipped} skipped, {errors} errors"
            )
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(
            self.style.SUCCESS(
                f'[COMPLETE] Import completed!\n'
                f'   Imported: {total_imported}\n'
                f'   Skipped: {total_skipped}\n'
                f'   Errors: {total_errors}\n'
                f'   Total games in DB: {Game.objects.count()}'
            )
        )

    def import_with_strategy(self, strategy, count):
        """Import games with a specific strategy"""
        pages_needed = (count + self.batch_size - 1) // self.batch_size
        imported = 0
        skipped = 0
        errors = 0
        
        ordering_map = {
            'popular': '-added',      # Most added to collections
            'rated': '-metacritic',   # Highest metacritic score
            'recent': '-released'     # Most recent releases
        }
        
        ordering = ordering_map.get(strategy, '-rating')
        
        for page in range(1, pages_needed + 1):
            if imported >= count:
                break
                
            self.stdout.write(f"   [PAGE] {page}/{pages_needed} ({strategy})...")
            
            try:
                params = {
                    'page': page,
                    'page_size': self.batch_size,
                    'ordering': ordering,
                    'rating__gte': self.min_rating,
                    'metacritic__gte': self.min_metacritic,
                }
                
                # Add date filters for recent strategy
                if strategy == 'recent':
                    params['dates'] = '2020-01-01,2024-12-31'
                
                # Use RAWG service to get games
                response = self.rawg_service.search_games_raw(params)
                
                if not response or 'results' not in response:
                    self.stdout.write(self.style.WARNING(f"   [WARN] No results for page {page}"))
                    continue
                
                games = response['results']
                
                # Process games in batch
                batch_imported, batch_skipped, batch_errors = self.process_games_batch(games)
                imported += batch_imported
                skipped += batch_skipped
                errors += batch_errors
                
                # Progress indicator
                progress = min(100, (imported / count) * 100)
                self.stdout.write(f"   [PROGRESS] {progress:.1f}% ({imported}/{count})")
                
                # Rate limiting
                time.sleep(self.delay)
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'   [ERROR] Error on page {page}: {str(e)}')
                )
                errors += 1
                continue
        
        return imported, skipped, errors

    def process_games_batch(self, games):
        """Process a batch of games"""
        imported = 0
        skipped = 0
        errors = 0
        
        with transaction.atomic():
            for game_data in games:
                try:
                    result = self.import_single_game(game_data)
                    if result == 'imported':
                        imported += 1
                    elif result == 'skipped':
                        skipped += 1
                    else:
                        errors += 1
                except Exception as e:
                    logger.error(f"Error processing game {game_data.get('id', 'unknown')}: {e}")
                    errors += 1
        
        return imported, skipped, errors

    def import_single_game(self, game_data):
        """Import a single game using the enhanced RAWGAPIService"""
        external_id = game_data.get('id')
        
        if not external_id:
            return 'error'
        
        # Check if game already exists
        if not self.force and Game.objects.filter(external_id=external_id).exists():
            return 'skipped'
        
        try:
            # Use RAWGAPIService to save the game properly
            game = self.rawg_service.save_game_to_db(game_data)
            
            if game:
                name = game.name[:50] + "..." if len(game.name) > 50 else game.name
                self.stdout.write(f"     [+] {name}")
                return 'imported'
            else:
                return 'error'
                
        except Exception as e:
            name = game_data.get('name', 'Unknown')[:30]
            self.stdout.write(f"     [ERROR] {name} - {str(e)}")
            return 'error'

    def get_api_usage_info(self):
        """Get RAWG API usage information"""
        try:
            # Test request to get rate limit info
            response = requests.get(
                'https://api.rawg.io/api/games',
                params={'key': config('RAWG_API_KEY'), 'page_size': 1},
                timeout=5
            )
            
            if response.status_code == 200:
                remaining = response.headers.get('X-RateLimit-Remaining', 'Unknown')
                limit = response.headers.get('X-RateLimit-Limit', 'Unknown')
                self.stdout.write(f"[API] Usage: {remaining}/{limit} requests remaining")
            
        except Exception:
            pass  # Ignore if we can't get usage info