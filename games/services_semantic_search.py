from django.db import connection
from .models import Game
from .services_embeddings import get_model
import numpy as np
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

def semantic_search_games(query: str, limit: int = 20, min_similarity: float = 0.3) -> List[Dict]:
    """
    Recherche sémantique intelligente basée sur les embeddings.
    
    Args:
        query: Requête de l'utilisateur (ex: "jeux comme Zelda", "RPG sombre")
        limit: Nombre maximum de résultats
        min_similarity: Score de similarité minimum (0-1)
    
    Returns:
        Liste de jeux avec scores de similarité
    """
    if not query.strip():
        return []
    
    try:
        # 1. Générer l'embedding de la requête
        model = get_model()
        query_embedding = model.encode(query, normalize_embeddings=True)
        
        logger.info(f"[SEMANTIC SEARCH] Recherche pour: '{query}'")
        
        # 2. Recherche optimisée selon la base de données
        if 'postgresql' in connection.vendor:
            results = _postgresql_semantic_search(query_embedding, limit, min_similarity)
        else:
            results = _sqlite_semantic_search(query_embedding, limit, min_similarity)
        
        logger.info(f"[SEMANTIC SEARCH] {len(results)} résultats trouvés")
        return results
        
    except Exception as e:
        logger.error(f"[SEMANTIC SEARCH] Erreur: {e}")
        return []


def _postgresql_semantic_search(query_embedding: np.ndarray, limit: int, min_similarity: float) -> List[Dict]:
    """
    Recherche sémantique optimisée pour PostgreSQL + pgvector
    """
    try:
        with connection.cursor() as cursor:
            # Utilise l'opérateur de distance cosinus de pgvector
            sql = """
                SELECT id, name, slug, background_image, rating, released, 
                       genres, platforms, tags, description,
                       1 - (embedding <=> %s::vector) as similarity_score
                FROM games 
                WHERE embedding IS NOT NULL 
                  AND 1 - (embedding <=> %s::vector) >= %s
                ORDER BY similarity_score DESC
                LIMIT %s
            """
            
            cursor.execute(sql, [
                query_embedding.tolist(), 
                query_embedding.tolist(), 
                min_similarity, 
                limit
            ])
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'id': row[0],
                    'name': row[1],
                    'slug': row[2],
                    'background_image': row[3],
                    'rating': row[4],
                    'released': row[5],
                    'genres': row[6],
                    'platforms': row[7],
                    'tags': row[8],
                    'description': row[9],
                    'similarity_score': float(row[10]),
                    'search_type': 'semantic_ai'
                })
            
            return results
            
    except Exception as e:
        logger.error(f"[POSTGRESQL SEARCH] Erreur: {e}")
        return []


def _sqlite_semantic_search(query_embedding: np.ndarray, limit: int, min_similarity: float) -> List[Dict]:
    """
    Recherche sémantique pour SQLite (fallback moins optimisé)
    """
    try:
        # Récupérer tous les jeux avec embeddings
        games_with_embeddings = Game.objects.exclude(embedding__isnull=True)
        
        similarities = []
        
        for game in games_with_embeddings:
            try:
                game_embedding = np.array(game.embedding)
                
                # Calcul de similarité cosinus
                similarity = np.dot(query_embedding, game_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(game_embedding)
                )
                
                if similarity >= min_similarity:
                    similarities.append((game, float(similarity)))
                    
            except (ValueError, TypeError) as e:
                logger.warning(f"[SQLITE SEARCH] Embedding invalide pour {game.name}: {e}")
                continue
        
        # Trier par similarité décroissante
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Convertir en format de réponse
        results = []
        for game, similarity in similarities[:limit]:
            results.append({
                'id': game.id,
                'name': game.name,
                'slug': game.slug,
                'background_image': game.background_image,
                'rating': game.rating,
                'released': game.released,
                'genres': game.genres,
                'platforms': game.platforms,
                'tags': game.tags,
                'description': game.description,
                'similarity_score': similarity,
                'search_type': 'semantic_ai'
            })
        
        return results
        
    except Exception as e:
        logger.error(f"[SQLITE SEARCH] Erreur: {e}")
        return []


def hybrid_search_games(query: str, limit: int = 20) -> List[Dict]:
    """
    Recherche hybride : combine recherche classique + sémantique
    """
    try:
        # 1. Recherche sémantique (70% des résultats)
        semantic_limit = int(limit * 0.7)
        semantic_results = semantic_search_games(query, semantic_limit, min_similarity=0.2)
        
        # 2. Recherche classique pour compléter (30% des résultats)
        classic_limit = limit - len(semantic_results)
        if classic_limit > 0:
            classic_results = _classic_text_search(query, classic_limit)
            
            # Éviter les doublons
            semantic_ids = {r['id'] for r in semantic_results}
            classic_results = [r for r in classic_results if r['id'] not in semantic_ids]
            
            # Combiner les résultats
            all_results = semantic_results + classic_results[:classic_limit]
        else:
            all_results = semantic_results
        
        logger.info(f"[HYBRID SEARCH] {len(semantic_results)} sémantiques + {len(all_results) - len(semantic_results)} classiques")
        
        return all_results[:limit]
        
    except Exception as e:
        logger.error(f"[HYBRID SEARCH] Erreur: {e}")
        return semantic_search_games(query, limit)


def _classic_text_search(query: str, limit: int) -> List[Dict]:
    """
    Recherche textuelle classique pour la recherche hybride
    """
    from django.db.models import Q
    
    games = Game.objects.filter(
        Q(name__icontains=query) | 
        Q(description__icontains=query)
    ).order_by('-rating')[:limit]
    
    results = []
    for game in games:
        results.append({
            'id': game.id,
            'name': game.name,
            'slug': game.slug,
            'background_image': game.background_image,
            'rating': game.rating,
            'released': game.released,
            'genres': game.genres,
            'platforms': game.platforms,
            'tags': game.tags,
            'description': game.description,
            'similarity_score': 0.5,  # Score arbitraire pour recherche classique
            'search_type': 'classic_text'
        })
    
    return results


def get_search_suggestions(query: str, limit: int = 5) -> List[str]:
    """
    Génère des suggestions de recherche basées sur l'IA
    """
    if len(query) < 3:
        return []
    
    try:
        # Recherche les jeux les plus similaires et extrait des termes de leurs descriptions
        results = semantic_search_games(query, limit=10, min_similarity=0.4)
        
        suggestions = []
        seen_terms = set()
        
        for result in results:
            # Extraire des mots-clés des genres et tags
            if result.get('genres'):
                for genre in result['genres']:
                    if isinstance(genre, dict):
                        term = genre.get('name', '')
                    else:
                        term = str(genre)
                    
                    if term and term.lower() not in seen_terms and len(term) > 2:
                        suggestions.append(f"{query} {term}")
                        seen_terms.add(term.lower())
                        
                        if len(suggestions) >= limit:
                            break
            
            if len(suggestions) >= limit:
                break
        
        return suggestions[:limit]
        
    except Exception as e:
        logger.error(f"[SEARCH SUGGESTIONS] Erreur: {e}")
        return []