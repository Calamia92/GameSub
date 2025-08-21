import requests
import time
from django.core.management.base import BaseCommand
from django.db import transaction
from games.models import Game
import json
from datetime import datetime

class Command(BaseCommand):
    help = 'Import games from RAWG API to populate the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--pages',
            type=int,
            default=10,
            help='Number of pages to import (20 games per page)'
        )
        parser.add_argument(
            '--key',
            type=str,
            required=True,
            help='RAWG API key'
        )

    def handle(self, *args, **options):
        api_key = options['key']
        pages = options['pages']
        
        self.stdout.write(f"Importing {pages} pages ({pages * 20} games) from RAWG API...")
        
        total_imported = 0
        total_skipped = 0
        
        for page in range(1, pages + 1):
            self.stdout.write(f"Processing page {page}/{pages}...")
            
            url = f"https://api.rawg.io/api/games"
            params = {
                'key': api_key,
                'page': page,
                'page_size': 20,
                'ordering': '-metacritic',  # Order by best rated
                'metacritic': '70,100',     # Only games with good ratings
            }
            
            try:
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                games = data.get('results', [])
                
                with transaction.atomic():
                    for game_data in games:
                        imported, skipped = self.import_game(game_data)
                        total_imported += imported
                        total_skipped += skipped
                
                # Rate limiting - RAWG allows 20000 requests per month
                time.sleep(0.5)
                
            except requests.RequestException as e:
                self.stdout.write(
                    self.style.ERROR(f'Error fetching page {page}: {str(e)}')
                )
                continue
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Unexpected error on page {page}: {str(e)}')
                )
                continue
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Import completed! '
                f'Imported: {total_imported}, '
                f'Skipped: {total_skipped}'
            )
        )

    def import_game(self, game_data):
        """Import a single game from RAWG data"""
        external_id = game_data.get('id')
        
        if not external_id:
            return 0, 1
        
        # Check if game already exists
        if Game.objects.filter(external_id=external_id).exists():
            return 0, 1
        
        try:
            # Clean and prepare data
            name = game_data.get('name', '').strip()
            if not name:
                return 0, 1
            
            # Parse date safely
            released = None
            if game_data.get('released'):
                try:
                    released = datetime.strptime(game_data['released'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    pass
            
            # Clean description
            description = game_data.get('description_raw', '')
            if description:
                # Remove problematic characters for Windows encoding
                description = description.encode('ascii', 'ignore').decode('ascii')
                description = description[:5000]  # Limit length
            
            # Process genres
            genres = []
            for genre in game_data.get('genres', []):
                if genre.get('name'):
                    genres.append({
                        'id': genre.get('id'),
                        'name': genre.get('name')
                    })
            
            # Process platforms
            platforms = []
            for platform in game_data.get('platforms', []):
                if platform.get('platform', {}).get('name'):
                    platforms.append({
                        'id': platform.get('platform', {}).get('id'),
                        'name': platform.get('platform', {}).get('name')
                    })
            
            # Process tags (limit to avoid too much data)
            tags = []
            for tag in game_data.get('tags', [])[:10]:  # Limit to 10 tags
                if tag.get('name'):
                    tags.append({
                        'id': tag.get('id'),
                        'name': tag.get('name')
                    })
            
            # Create game
            game = Game.objects.create(
                external_id=external_id,
                name=name,
                slug=game_data.get('slug', ''),
                description=description,
                released=released,
                rating=game_data.get('rating'),
                metacritic=game_data.get('metacritic'),
                playtime=game_data.get('playtime'),
                background_image=game_data.get('background_image'),
                website=game_data.get('website'),
                genres=genres,
                platforms=platforms,
                tags=tags
            )
            
            self.stdout.write(f"   Imported: {name}")
            return 1, 0
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f"   Error importing {name}: {str(e)}")
            )
            return 0, 1