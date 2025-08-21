from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Game
from .services_embeddings import generate_embedding_for_game

@receiver(post_save, sender=Game)
def update_game_embedding(sender, instance, created, **kwargs):
    """Met à jour l'embedding quand un jeu est créé ou modifié."""
    # Champs qui impactent l'embedding
    embedding_fields = ['name', 'description', 'genres', 'platforms', 'tags', 'stores', 
                       'esrb_rating', 'rating', 'metacritic', 'playtime', 'released', 'website']
    
    # Si nouveau jeu ou un champ pertinent a changé
    if created or not instance.embedding:
        generate_embedding_for_game(instance)
    elif hasattr(instance, '_state') and instance._state.fields_cache:
        # Vérifier si un champ pertinent a changé (nécessite une logique plus complexe)
        # Pour l'instant, on régénère toujours - à optimiser plus tard
        generate_embedding_for_game(instance)
