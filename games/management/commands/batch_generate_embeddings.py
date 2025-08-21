from django.core.management.base import BaseCommand
from django.db import transaction
from games.models import Game
from games.services_embeddings import EmbeddingService
import time
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Generate embeddings for games in batches'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of games to process per batch (default: 100)'
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=1.0,
            help='Delay between batches in seconds (default: 1.0)'
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip games that already have embeddings'
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        delay = options['delay']
        skip_existing = options['skip_existing']
        
        # Initialize embedding service
        embedding_service = EmbeddingService()
        
        # Get games without embeddings
        if skip_existing:
            games_query = Game.objects.filter(embedding__isnull=True)
            self.stdout.write("🔍 Processing games without embeddings...")
        else:
            games_query = Game.objects.all()
            self.stdout.write("🔍 Processing all games...")
        
        total_games = games_query.count()
        
        if total_games == 0:
            self.stdout.write(self.style.SUCCESS("✅ No games to process!"))
            return
        
        self.stdout.write(f"📊 Found {total_games} games to process")
        self.stdout.write(f"⚙️  Batch size: {batch_size}, delay: {delay}s")
        self.stdout.write("=" * 60)
        
        processed = 0
        errors = 0
        
        # Process in batches
        for i in range(0, total_games, batch_size):
            batch_games = games_query[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_games + batch_size - 1) // batch_size
            
            self.stdout.write(f"\n📦 Batch {batch_num}/{total_batches} ({len(batch_games)} games)")
            
            batch_processed, batch_errors = self.process_batch(batch_games, embedding_service)
            processed += batch_processed
            errors += batch_errors
            
            # Progress update
            progress = (processed / total_games) * 100
            self.stdout.write(f"   📊 Progress: {progress:.1f}% ({processed}/{total_games})")
            
            # Delay between batches to avoid overwhelming the system
            if i + batch_size < total_games:
                time.sleep(delay)
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(
            self.style.SUCCESS(
                f'🎉 Embedding generation completed!\n'
                f'   ✅ Processed: {processed}\n'
                f'   ❌ Errors: {errors}\n'
                f'   📊 Success rate: {(processed/(processed+errors)*100):.1f}%'
            )
        )

    def process_batch(self, games, embedding_service):
        """Process a batch of games"""
        processed = 0
        errors = 0
        
        for game in games:
            try:
                # Generate embedding
                embedding = embedding_service.generate_game_embedding(game)
                
                if embedding is not None:
                    # Save embedding to game
                    game.embedding = embedding
                    game.save(update_fields=['embedding'])
                    
                    # Show progress for each game
                    name = game.name[:40] + "..." if len(game.name) > 40 else game.name
                    self.stdout.write(f"     ✅ {name}")
                    processed += 1
                else:
                    self.stdout.write(f"     ❌ Failed to generate embedding for {game.name}")
                    errors += 1
                    
            except Exception as e:
                logger.error(f"Error processing game {game.id}: {e}")
                self.stdout.write(f"     ❌ Error: {game.name} - {str(e)}")
                errors += 1
        
        return processed, errors