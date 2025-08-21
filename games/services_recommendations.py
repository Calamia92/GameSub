from django.db import connection
from .models import Game, UserGame
import numpy as np
from typing import List, Tuple


def cosine_similarity_sql(target_embedding: List[float], limit: int = 10) -> str:
    """
    Génère une requête SQL pour calculer la similarité cosinus avec pgvector.
    Pour SQLite, on utilise une approximation moins efficace.
    """
    # Pour PostgreSQL avec pgvector (idéal)
    if 'postgresql' in connection.vendor:
        return f"""
            SELECT id, name, background_image, rating, 
                   (embedding <=> %s::vector) as distance
            FROM games 
            WHERE embedding IS NOT NULL
            ORDER BY distance ASC
            LIMIT %s
        """
    
    # Pour SQLite (fallback moins efficace)
    return f"""
        SELECT id, name, background_image, rating,
               json_array_length(embedding) as emb_length
        FROM games 
        WHERE embedding IS NOT NULL
        ORDER BY RANDOM()
        LIMIT %s
    """


def get_recommendations_for_user(user_id: str, limit: int = 10) -> List[dict]:
    """
    Recommande des jeux basés sur les favoris de l'utilisateur.
    """
    # Récupérer les jeux favoris de l'utilisateur
    user_favorites = UserGame.objects.filter(
        user_id=user_id, 
        status='favorite'
    ).select_related('game').values_list('game__id', flat=True)
    
    if not user_favorites:
        # Si pas de favoris, recommander les jeux les mieux notés
        return get_top_rated_games(limit)
    
    # Récupérer les embeddings des favoris
    favorite_games = Game.objects.filter(
        id__in=user_favorites, 
        embedding__isnull=False
    )
    
    if not favorite_games:
        return get_top_rated_games(limit)
    
    # Calculer l'embedding moyen des favoris
    embeddings = []
    for game in favorite_games:
        if game.embedding:
            embeddings.append(np.array(game.embedding))
    
    if not embeddings:
        return get_top_rated_games(limit)
    
    avg_embedding = np.mean(embeddings, axis=0).tolist()
    
    # Trouver les jeux similaires
    recommendations = find_similar_games(
        avg_embedding, 
        exclude_ids=list(user_favorites),
        limit=limit
    )
    
    return recommendations


def get_recommendations_for_game(game_id: int, limit: int = 5) -> List[dict]:
    """
    Recommande des jeux similaires à un jeu donné.
    """
    try:
        game = Game.objects.get(id=game_id)
        if not game.embedding:
            return get_top_rated_games(limit)
        
        return find_similar_games(
            game.embedding, 
            exclude_ids=[game_id],
            limit=limit
        )
    except Game.DoesNotExist:
        return []


def find_similar_games(target_embedding: List[float], exclude_ids: List[int] = None, limit: int = 10) -> List[dict]:
    """
    Trouve les jeux les plus similaires à un embedding donné.
    """
    if exclude_ids is None:
        exclude_ids = []
    
    recommendations = []
    
    try:
        with connection.cursor() as cursor:
            if 'postgresql' in connection.vendor:
                # PostgreSQL avec pgvector
                cursor.execute(
                    cosine_similarity_sql(target_embedding, limit + len(exclude_ids)),
                    [target_embedding, limit + len(exclude_ids)]
                )
            else:
                # SQLite fallback - recommandations aléatoires pour l'instant
                cursor.execute(
                    cosine_similarity_sql(target_embedding, limit * 2),
                    [limit * 2]
                )
            
            for row in cursor.fetchall():
                game_id = row[0]
                if game_id not in exclude_ids:
                    recommendations.append({
                        'id': game_id,
                        'name': row[1],
                        'background_image': row[2],
                        'rating': row[3],
                        'similarity_score': 1.0 - row[4] if len(row) > 4 else 0.8  # Distance -> Similarité
                    })
                    
                    if len(recommendations) >= limit:
                        break
    
    except Exception as e:
        print(f"Erreur lors de la recherche de similarité: {e}")
        return get_top_rated_games(limit)
    
    return recommendations


def get_top_rated_games(limit: int = 10) -> List[dict]:
    """
    Retourne les jeux les mieux notés comme fallback.
    """
    games = Game.objects.filter(
        rating__isnull=False
    ).order_by('-rating')[:limit]
    
    return [{
        'id': game.id,
        'name': game.name,
        'background_image': game.background_image,
        'rating': game.rating,
        'similarity_score': 0.7  # Score arbitraire pour les top rated
    } for game in games]


def get_trending_recommendations(limit: int = 10) -> List[dict]:
    """
    Recommandations basées sur les tendances (jeux récents bien notés).
    """
    from datetime import datetime, timedelta
    
    # Jeux sortis dans les 2 dernières années avec bonne note
    recent_date = datetime.now().date() - timedelta(days=730)
    
    games = Game.objects.filter(
        released__gte=recent_date,
        rating__gte=4.0
    ).order_by('-rating', '-released')[:limit]
    
    return [{
        'id': game.id,
        'name': game.name,
        'background_image': game.background_image,
        'rating': game.rating,
        'similarity_score': 0.6,  # Score pour trending
        'is_trending': True
    } for game in games]