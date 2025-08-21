from sentence_transformers import SentenceTransformer
from .models import Game
from django.db import transaction
import numpy as np

MODEL_NAME = "all-MiniLM-L6-v2"
_model = None

def get_model():
    """Charge le modèle une seule fois (singleton)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def extract_name(item):
    """Retourne le nom si c'est un dict, sinon la valeur elle-même."""
    if isinstance(item, dict):
        return item.get("name", "N/A")
    return str(item)

def text_for_game(game: Game) -> str:
    """Concatène toutes les infos importantes du jeu pour l'embedding."""
    genres = ", ".join([extract_name(g) for g in (game.genres or [])])
    platforms = ", ".join([extract_name(p) for p in (game.platforms or [])])
    tags = ", ".join([extract_name(t) for t in (game.tags or [])])
    stores = ", ".join([extract_name(s) for s in (game.stores or [])])
    
    return (
        f"{game.name} | {game.description or ''} | "
        f"Genres: {genres} | Platforms: {platforms} | Tags: {tags} | Stores: {stores} | "
        f"ESRB: {game.esrb_rating or 'N/A'} | Rating: {game.rating or 'N/A'} | "
        f"Metacritic: {game.metacritic or 'N/A'} | Playtime: {game.playtime or 'N/A'} | "
        f"Released: {game.released or 'N/A'} | Website: {game.website or 'N/A'} | "
    )


def generate_embedding_for_game(game: Game):
    model = get_model()
    text = text_for_game(game)
    emb = model.encode(text, normalize_embeddings=True)

    # Mettre à jour directement sans passer par save()
    Game.objects.filter(pk=game.pk).update(embedding=emb.tolist())

    return emb

def embed_games(game_ids=None, batch_size=128):
    """Backfill ou update en batch des embeddings de tous les jeux ou d'une liste d'IDs."""
    qs = Game.objects.all().order_by("id")
    if game_ids:
        qs = qs.filter(id__in=game_ids)

    model = get_model()
    buffer = []
    to_update = []

    for g in qs.iterator():
        buffer.append((g, text_for_game(g)))
        if len(buffer) >= batch_size:
            _flush(buffer, model, to_update)
            buffer = []

    if buffer:
        _flush(buffer, model, to_update)

def _flush(buffer, model, to_update):
    """Calcule embeddings pour un lot et les sauvegarde en base."""
    texts = [t for _, t in buffer]
    embs = model.encode(texts, normalize_embeddings=True)
    for (game, _), emb in zip(buffer, embs):
        game.embedding = emb.tolist()
        to_update.append(game)
    with transaction.atomic():
        Game.objects.bulk_update(to_update, ["embedding"])
    to_update.clear()
