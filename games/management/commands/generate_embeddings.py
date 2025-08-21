from django.core.management.base import BaseCommand
from games.services_embeddings import embed_games
from games.models import Game


class Command(BaseCommand):
    help = 'Generate embeddings for all games or specific game IDs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=128,
            help='Batch size for processing (default: 128)'
        )
        parser.add_argument(
            '--game-ids',
            nargs='+',
            type=int,
            help='List of specific game IDs to process'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regeneration even if embedding already exists'
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        game_ids = options['game_ids']
        force = options['force']

        if game_ids:
            self.stdout.write(f"Generating embeddings for {len(game_ids)} specific games...")
            embed_games(game_ids=game_ids, batch_size=batch_size)
        else:
            total_games = Game.objects.count()
            if not force:
                games_without_embedding = Game.objects.filter(embedding__isnull=True).count()
                self.stdout.write(f"Generating embeddings for {games_without_embedding} games without embeddings...")
            else:
                self.stdout.write(f"Force regenerating embeddings for all {total_games} games...")
            
            embed_games(batch_size=batch_size)

        self.stdout.write(
            self.style.SUCCESS('Embedding generation completed successfully!')
        )