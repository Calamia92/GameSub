import numpy as np
from django.db.models import F
from .models import Game, UserGame


def recommend_games_for_game(game_id, top_n=5):

    try:
        source_game = Game.objects.get(id=game_id)
    except Game.DoesNotExist:
        print(f"[ERROR] Jeu avec ID {game_id} non trouvé")
        return []

    if source_game.embedding is None:
        print(f"[WARNING] Pas d'embedding pour le jeu {source_game.name}")
        return []

    print(f"[INFO] Generation de recommandations basees sur {source_game.name}")
    
    source_emb = np.array(source_game.embedding)

    # Récupère tous les autres jeux qui ont un embedding
    candidates = Game.objects.exclude(id=source_game.id).exclude(embedding=None)
    print(f"[INFO] {candidates.count()} jeux candidats trouves")

    def cosine_similarity(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    # Calcul des similarités
    similarities = [
        (g, cosine_similarity(source_emb, np.array(g.embedding)))
        for g in candidates
    ]

    # Trie par score de similarité décroissant
    similarities.sort(key=lambda x: x[1], reverse=True)

    # Retourne les jeux
    recommended_games = [g for g, sim in similarities[:top_n]]
    
    print(f"[SUCCESS] {len(recommended_games)} recommandations generees pour {source_game.name}")
    for i, game in enumerate(recommended_games, 1):
        print(f"  {i}. {game.name}")

    return recommended_games


def recommend_by_library_and_fav(user, top_n=8):
    """
    👤 RECOMMANDATIONS BASÉES SUR LA BIBLIOTHÈQUE UTILISATEUR
    
    Utilisé par: GET /api/substitutes_library_fav/
    Recommande des jeux basés sur TOUTE la bibliothèque de l'utilisateur.
    """
    favorites = UserGame.objects.filter(user_id=user, status__in=['library', 'favorite']).select_related('game')

    # Filter valid embeddings
    fav_embeddings = [
        f.game.embedding
        for f in favorites
        if f.game.embedding is not None and hasattr(f.game.embedding, 'size') and f.game.embedding.size > 0
    ]

    if not fav_embeddings:
        print(f"[WARNING] Aucun jeu avec embedding trouve dans la bibliotheque de l'utilisateur {user}")
        return []

    print(f"[INFO] {len(fav_embeddings)} jeux trouves dans la bibliotheque avec embeddings")
    
    # Afficher les jeux de la bibliothèque
    for fav in favorites[:5]:  # Affiche les 5 premiers
        print(f"  [LIB] {fav.game.name}")

    # Convert to NumPy array
    fav_embeddings = np.array(fav_embeddings)

    # Compute mean embedding (profil utilisateur)
    user_profile = np.mean(fav_embeddings, axis=0)

    # Get all games (sauf ceux déjà dans la bibliothèque)
    excluded_ids = [f.game.id for f in favorites]
    games = Game.objects.exclude(id__in=excluded_ids).exclude(embedding=None)

    def cosine_similarity(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    similarities = [
        (g, cosine_similarity(user_profile, np.array(g.embedding)))
        for g in games if g.embedding is not None
    ]

    # Sort by similarity descending and take top_n
    similarities.sort(key=lambda x: x[1], reverse=True)
    recommended_games = [g for g, sim in similarities[:top_n]]

    print(f"[SUCCESS] {len(recommended_games)} recommandations generees basees sur le profil utilisateur")
    for i, game in enumerate(recommended_games, 1):
        print(f"  {i}. {game.name}")
    
    return recommended_games