from django.core.management.base import BaseCommand
from games.models import Game
from games.services_embeddings import generate_embedding_for_game

class Command(BaseCommand):
    help = "Remplit les embeddings pour tous les jeux"

    def handle(self, *args, **kwargs):
        games = Game.objects.all()
        for game in games:
            game.embedding = generate_embedding_for_game(game)
            self.stdout.write(f"Embedding ajouté pour {game.name}")
