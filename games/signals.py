from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Game
from .services_embeddings import generate_embedding_for_game

@receiver(post_save, sender=Game)
def update_game_embedding(sender, instance, created, **kwargs):
    """Met à jour l'embedding quand un jeu est créé ou modifié."""
    generate_embedding_for_game(instance)
