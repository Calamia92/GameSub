from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Game, Substitution, UserGame, SearchHistory, UserLibrary
from .models_profile import UserProfile
from django.db.models import Count
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from decouple import config
from django.conf import settings
import logging

logger = logging.getLogger(__name__)
from .serializers import (
    GameSerializer, GameSearchSerializer, SubstitutionSerializer,
    SubstitutionCreateSerializer, UserGameSerializer, UserGameCreateSerializer,
    SearchHistorySerializer, SearchHistoryCreateSerializer, UserLibrarySerializer,
    UserLibraryCreateSerializer, AddGameFromAPISerializer
)
from .services import RAWGAPIService
from .recommender import recommend_by_library_and_fav, recommend_games_for_game
from .services_recommendations import (
    get_recommendations_for_user, 
    get_recommendations_for_game,
    get_trending_recommendations
)
from .services_semantic_search import (
    semantic_search_games,
    hybrid_search_games,
    get_search_suggestions
)
from .services_ai_filters import (
    ai_search_with_adaptive_filters,
    get_ai_filter_options
)

# -------------------------------
# Games
# -------------------------------
class GameListView(generics.ListAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSearchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Cache optimisé pour Redis 30MB
        search = self.request.query_params.get('search')
        genre = self.request.query_params.get('genre')
        platform = self.request.query_params.get('platform')
        
        cache_key = f"games_{hash(f'{search}_{genre}_{platform}')}"  # Hash pour clé courte
        queryset = cache.get(cache_key)
        
        if queryset is None:
            queryset = Game.objects.all()
            
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) | Q(description__icontains=search)
                )
            if genre:
                queryset = queryset.filter(genres__icontains=genre)
            if platform:
                queryset = queryset.filter(platforms__icontains=platform)
                
            queryset = queryset.order_by('-rating')
            
            # TTL configurable depuis .env
            ttl = config('CACHE_TTL_GAMES', default=120, cast=int)
            cache.set(cache_key, queryset, ttl)
            
        return queryset

class GameDetailView(generics.RetrieveAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [permissions.AllowAny]

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_games_api(request):
    query = request.GET.get('q', '')
    page = int(request.GET.get('page', 1))
    genres = request.GET.get('genres')
    platforms = request.GET.get('platforms')
    dates = request.GET.get('dates')
    rating = request.GET.get('rating')
    ordering = request.GET.get('ordering')
    
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    rawg_service = RAWGAPIService()
    results = rawg_service.search_games(
        query=query,
        page=page,
        genres=genres,
        platforms=platforms,
        dates=dates,
        rating=rating,
        ordering=ordering
    )
    
    if not results:
        return Response({'error': 'API request failed'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Sauvegarder les jeux dans la base et filtrer ceux avec rating > 0
    filtered_results = []
    for game_data in results.get('results', []):
        # Sauvegarder le jeu
        game = rawg_service.save_game_to_db(game_data)
        
        # Garder seulement si rating >= 3.0 (qualité minimum)
        if game and game.rating and game.rating >= 3.0:
            filtered_results.append(game_data)
    
    # Mettre à jour les résultats avec la version filtrée
    results['results'] = filtered_results
    results['count'] = len(filtered_results)
    
    # Enregistrer la recherche dans l'historique si l'utilisateur est connecté
    if request.user.is_authenticated:
        try:
            filters = {}
            if genres:
                filters['genres'] = genres
            if platforms:
                filters['platforms'] = platforms
            if dates:
                filters['dates'] = dates
                
            # Évite les doublons récents et limite l'historique
            recent_cutoff = timezone.now() - timedelta(minutes=5)
            existing = SearchHistory.objects.filter(
                user_id=request.user.id,
                query=query,
                created_at__gt=recent_cutoff
            ).exists()
            
            if not existing:
                SearchHistory.objects.create(
                    user_id=request.user.id,
                    query=query,
                    filters=filters,
                    results_count=results.get('count', 0)
                )
                
                # Nettoie automatiquement si plus de 100 recherches
                search_count = SearchHistory.objects.filter(user_id=request.user.id).count()
                if search_count > 100:
                    old_searches = SearchHistory.objects.filter(
                        user_id=request.user.id
                    ).order_by('created_at')[:search_count-50]
                    SearchHistory.objects.filter(
                        id__in=[s.id for s in old_searches]
                    ).delete()
        except Exception as e:
            pass  # Ignorer les erreurs d'historique
    
    return Response(results)

# -------------------------------
# RECOMMANDATIONS - 2 ROUTES DÉDIÉES
# -------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_game_substitutes(request, game_id):
    
    try:
        source_game = Game.objects.get(external_id=game_id)
    except Game.DoesNotExist:
        rawg_service = RAWGAPIService()
        game_data = rawg_service.get_game_details(game_id)
        if not game_data:
            return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)
        source_game = rawg_service.save_game_to_db(game_data)

    user_id = getattr(request.user, 'id', None)
    
    if not user_id:
        return Response({'error': 'Invalid user ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Recommandations basées uniquement sur CE jeu spécifique
    recommended_games = recommend_games_for_game(source_game.id, top_n=5)
    print(f"[INFO] Mode JEU: Recommandations basees uniquement sur {source_game.name}")
    print(f"Resultat: {len(recommended_games)} jeux recommandes")

    substitutes_data = []
    for game in recommended_games:
        data = GameSerializer(game).data
        substitutes_data.append(data)

        # Sauvegarde en base
        Substitution.objects.get_or_create(
            user_id=user_id,
            source_game=source_game,
            substitute_game=game,
            defaults={'similarity_score': 0.9}
        )

    return Response({
        'mode': 'game',
        'source_game': GameSerializer(source_game).data,
        'recommended_substitutes': substitutes_data,
        'total_substitutes': len(substitutes_data)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_library_recommendations(request):

    user_id = getattr(request.user, 'id', None)
    
    if not user_id:
        return Response({'error': 'Invalid user ID'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Vérifier que l'utilisateur a des jeux dans sa bibliothèque
    user_games = UserGame.objects.filter(
        user_id=user_id, 
        status__in=['library', 'favorite']
    ).select_related('game')
    
    if not user_games.exists():
        return Response({
            'mode': 'library',
            'message': 'No games in library yet. Add some games to get personalized recommendations!',
            'recommended_substitutes': [],
            'user_library_count': 0
        })
    
    # Recommandations basées sur TOUTE la bibliothèque utilisateur
    recommended_games = recommend_by_library_and_fav(user=user_id, top_n=8)
    
    print(f"[INFO] Mode BIBLIOTHEQUE: Recommandations basees sur {user_games.count()} jeux de l'utilisateur {user_id}")
    print(f"Resultat: {len(recommended_games)} jeux recommandes")
    
    substitutes_data = []
    for game in recommended_games:
        data = GameSerializer(game).data
        substitutes_data.append(data)
        
        # Pour la sauvegarde, on utilise le premier jeu de la bibliothèque comme "source"
        first_library_game = user_games.first().game
        Substitution.objects.get_or_create(
            user_id=user_id,
            source_game=first_library_game,
            substitute_game=game,
            mode='user',
            defaults={'similarity_score': 0.9}
        )
    
    return Response({
        'mode': 'user',
        'user_library_count': user_games.count(),
        'library_games': [GameSerializer(ug.game).data for ug in user_games[:5]],  # Montre les 5 premiers jeux de la biblio
        'recommended_substitutes': substitutes_data,
        'total_recommendations': len(substitutes_data)
    })


# -------------------------------
# Substitutions
# -------------------------------
class SubstitutionListCreateView(generics.ListCreateAPIView):
    serializer_class = SubstitutionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = getattr(self.request.user, 'id', None)
        if not user_id:
            return Substitution.objects.none()
        # Optimisation: select_related pour éviter les requêtes N+1
        return Substitution.objects.filter(user_id=user_id).select_related(
            'source_game', 'substitute_game'
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubstitutionCreateSerializer
        return SubstitutionSerializer

    def perform_create(self, serializer):
        rawg_service = RAWGAPIService()
        similarity_score = rawg_service.calculate_similarity_score(
            serializer.validated_data['source_game'],
            serializer.validated_data['substitute_game']
        )
        user_id = getattr(self.request.user, 'id', None)
        serializer.save(user_id=user_id, similarity_score=similarity_score)

# -------------------------------
# User Games
# -------------------------------
class UserGameListCreateView(generics.ListCreateAPIView):
    serializer_class = UserGameSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = getattr(self.request.user, 'id', None)
        if not user_id:
            return UserGame.objects.none()
            
        status_filter = self.request.query_params.get('status')
        
        # Cache optimisé par utilisateur et statut
        cache_key = f"ug_{user_id}_{hash(status_filter or 'all')}"  # Clé courte
        queryset = cache.get(cache_key)
        
        if queryset is None:
            # Optimisation: select_related pour éviter les requêtes N+1
            queryset = UserGame.objects.filter(user_id=user_id).select_related('game')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            queryset = queryset.order_by('-created_at')
            
            # TTL configurable
            ttl = config('CACHE_TTL_USER_GAMES', default=60, cast=int)
            cache.set(cache_key, queryset, ttl)
            
        return queryset

    def perform_create(self, serializer):
        user_id = getattr(self.request.user, 'id', None)
        serializer.save(user_id=user_id)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserGameCreateSerializer
        return UserGameSerializer


# -------------------------------
# Search History
# -------------------------------
class SearchHistoryListView(generics.ListAPIView):
    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = getattr(self.request.user, 'id', None)
        if not user_id:
            return SearchHistory.objects.none()
        return SearchHistory.objects.filter(user_id=user_id)[:20]  # Limite à 20 recherches récentes


# -------------------------------
# User Library
# -------------------------------
class UserLibraryListCreateView(generics.ListCreateAPIView):
    serializer_class = UserLibrarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = getattr(self.request.user, 'id', None)
        if not user_id:
            return UserLibrary.objects.none()
        return UserLibrary.objects.filter(user_id=user_id)

    def perform_create(self, serializer):
        user_id = getattr(self.request.user, 'id', None)
        serializer.save(user_id=user_id)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserLibraryCreateSerializer
        return UserLibrarySerializer


class UserLibraryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserLibrarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = getattr(self.request.user, 'id', None)
        if not user_id:
            return UserLibrary.objects.none()
        return UserLibrary.objects.filter(user_id=user_id)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_library_games(request, library_id):
    """Récupérer tous les jeux d'une bibliothèque"""
    try:
        user_id = getattr(request.user, 'id', None)
        library = UserLibrary.objects.get(id=library_id, user_id=user_id)
        
        # Optimisation avec select_related
        games = UserGame.objects.filter(
            user_id=user_id, status='library'
        ).select_related('game')
        serializer = UserGameSerializer(games, many=True)
        
        return Response({
            'library': UserLibrarySerializer(library).data,
            'games': serializer.data
        })
    except UserLibrary.DoesNotExist:
        return Response({'error': 'Library not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_game_from_api(request):
    """Ajouter un jeu depuis l'API RAWG à la bibliothèque"""
    serializer = AddGameFromAPISerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    external_id = serializer.validated_data['external_id']
    add_to_library = serializer.validated_data.get('add_to_library', True)
    
    # Récupérer ou créer le jeu depuis l'API RAWG
    rawg_service = RAWGAPIService()
    
    try:
        # Vérifier si le jeu existe déjà en base
        game = Game.objects.get(external_id=external_id)
    except Game.DoesNotExist:
        # Récupérer les détails depuis l'API RAWG
        game_data = rawg_service.get_game_details(external_id)
        if not game_data:
            return Response({'error': 'Game not found on RAWG API'}, status=status.HTTP_404_NOT_FOUND)
        
        # Sauvegarder le jeu en base
        game = rawg_service.save_game_to_db(game_data)
        if not game:
            return Response({'error': 'Failed to save game'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Ajouter à la bibliothèque si demandé
    user_id = getattr(request.user, 'id', None)
    if add_to_library:
        user_game, created = UserGame.objects.get_or_create(
            user_id=user_id,
            game=game,
            defaults={'status': 'library'}
        )
        
        if not created:
            # Si le jeu existe déjà, on met à jour le statut
            user_game.status = 'library'
            user_game.save()
    
    return Response({
        'game': GameSerializer(game).data,
        'added_to_library': add_to_library,
        'message': f"Game '{game.name}' successfully added" + (" to library" if add_to_library else "")
    })


# -------------------------------
# Profile Management
# -------------------------------
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    GET: Récupère le profil utilisateur
    PATCH: Met à jour le profil utilisateur
    """
    # Avec Supabase, request.user est un SupabaseUser, pas un User Django
    user_auth = request.user
    user_id = user_auth.id if hasattr(user_auth, 'id') else user_auth.user_id
    user_email = user_auth.email if hasattr(user_auth, 'email') else 'unknown@example.com'
    
    if request.method == 'GET':
        # Cache le profil pour optimiser les performances
        cache_key = f"profile_{user_id}"
        profile_data = cache.get(cache_key)
        
        if profile_data is None:
            # Pour Supabase, on simule un profil sans base de données pour l'instant
            profile_data = {
                'user_id': user_id,
                'email': user_email,
                'display_name': user_email.split('@')[0] if user_email else 'Utilisateur',
                'bio': '',
                'favorite_genre': '',
                'created_at': timezone.now().isoformat(),
            }
            cache.set(cache_key, profile_data, timeout=config('CACHE_TTL_USER_GAMES', default=60, cast=int))
        
        return Response(profile_data)
    
    elif request.method == 'PATCH':
        # Pour l'instant, on simule la mise à jour
        display_name = request.data.get('display_name')
        bio = request.data.get('bio')
        favorite_genre = request.data.get('favorite_genre')
        
        # Simulation de la sauvegarde dans le cache
        cache_key = f"profile_{user_id}"
        profile_data = {
            'user_id': user_id,
            'email': user_email,
            'display_name': display_name or user_email.split('@')[0],
            'bio': bio or '',
            'favorite_genre': favorite_genre or '',
            'created_at': timezone.now().isoformat(),
        }
        
        # Sauvegarder dans le cache
        cache.set(cache_key, profile_data, timeout=config('CACHE_TTL_USER_GAMES', default=60, cast=int))
        
        return Response({
            'message': 'Profil mis à jour avec succès',
            'display_name': profile_data['display_name'],
            'bio': profile_data['bio'],
            'favorite_genre': profile_data['favorite_genre'],
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """
    Récupère les statistiques de l'utilisateur
    """
    user_auth = request.user
    user_id = user_auth.id if hasattr(user_auth, 'id') else user_auth.user_id
    
    # Cache les statistiques
    cache_key = f"stats_{user_id}"
    stats = cache.get(cache_key)
    
    if stats is None:
        # Compter les substituts sauvegardés
        total_substitutes = Substitution.objects.filter(user_id=user_id).count()
        
        # Compter les jeux en bibliothèque
        total_library = UserGame.objects.filter(user_id=user_id).count()
        
        # Compter les recherches effectuées
        total_searches = SearchHistory.objects.filter(user_id=user_id).count()
        
        stats = {
            'total_substitutes': total_substitutes,
            'total_library': total_library,
            'total_searches': total_searches,
        }
        
        # Cache pendant 5 minutes
        cache.set(cache_key, stats, timeout=300)
    
    return Response(stats)


# -------------------------------
# AI Recommendations
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_recommendations(request):
    """
    Recommandations de jeux basées sur l'IA pour l'utilisateur connecté
    """
    user_auth = request.user
    user_id = user_auth.id if hasattr(user_auth, 'id') else user_auth.user_id
    
    # Cache les recommandations pendant 1 heure
    cache_key = f"recommendations_{user_id}"
    recommendations = cache.get(cache_key)
    
    if recommendations is None:
        limit = int(request.GET.get('limit', 10))
        
        # Obtenir recommandations basées sur les favoris
        recommendations = get_recommendations_for_user(str(user_id), limit=limit)
        
        # Si pas assez de recommandations, ajouter des tendances
        if len(recommendations) < limit:
            trending = get_trending_recommendations(limit - len(recommendations))
            recommendations.extend(trending)
        
        # Cache pendant 1 heure
        cache.set(cache_key, recommendations, timeout=3600)
    
    return Response({
        'recommendations': recommendations,
        'count': len(recommendations)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def game_recommendations(request, game_id):
    """
    Recommandations de jeux similaires à un jeu donné
    """
    # Cache par jeu pendant 24h (moins volatile)
    cache_key = f"game_rec_{game_id}"
    recommendations = cache.get(cache_key)
    
    if recommendations is None:
        limit = int(request.GET.get('limit', 5))
        recommendations = get_recommendations_for_game(game_id, limit=limit)
        
        # Cache pendant 24 heures
        cache.set(cache_key, recommendations, timeout=86400)
    
    return Response({
        'game_id': game_id,
        'recommendations': recommendations,
        'count': len(recommendations)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def trending_recommendations(request):
    """
    Jeux tendance et récents bien notés
    """
    cache_key = "trending_games"
    trending = cache.get(cache_key)
    
    if trending is None:
        limit = int(request.GET.get('limit', 15))
        trending = get_trending_recommendations(limit=limit)
        
        # Cache pendant 6 heures (assez volatile)
        cache.set(cache_key, trending, timeout=21600)
    
    return Response({
        'trending': trending,
        'count': len(trending)
    })


# -------------------------------
# Semantic AI Search
# -------------------------------
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def semantic_search_endpoint(request):
    """
    Recherche sémantique IA basée sur les embeddings
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    limit = int(request.GET.get('limit', 20))
    min_similarity = float(request.GET.get('min_similarity', 0.3))
    
    # Cache pour optimiser les performances
    cache_key = f"semantic_search_{hash(f'{query}_{limit}_{min_similarity}')}"
    results = cache.get(cache_key)
    
    if results is None:
        results = semantic_search_games(query, limit=limit, min_similarity=min_similarity)
        
        # Cache pendant 1 heure
        cache.set(cache_key, results, timeout=3600)
    
    return Response({
        'query': query,
        'results': results,
        'count': len(results),
        'search_type': 'semantic_ai'
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def hybrid_search_endpoint(request):
    """
    Recherche hybride : combine IA sémantique + recherche classique
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    limit = int(request.GET.get('limit', 20))
    
    # Cache pour optimiser
    cache_key = f"hybrid_search_{hash(f'{query}_{limit}')}"
    results = cache.get(cache_key)
    
    if results is None:
        results = hybrid_search_games(query, limit=limit)
        
        # Cache pendant 30 minutes (plus volatile que sémantique pure)
        cache.set(cache_key, results, timeout=1800)
    
    return Response({
        'query': query,
        'results': results,
        'count': len(results),
        'search_type': 'hybrid_ai'
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_suggestions_endpoint(request):
    """
    Suggestions de recherche intelligentes basées sur l'IA
    """
    query = request.GET.get('q', '').strip()
    if len(query) < 2:
        return Response({'suggestions': []})
    
    limit = int(request.GET.get('limit', 5))
    
    # Cache court pour les suggestions
    cache_key = f"search_suggestions_{hash(f'{query}_{limit}')}"
    suggestions = cache.get(cache_key)
    
    if suggestions is None:
        suggestions = get_search_suggestions(query, limit=limit)
        
        # Cache pendant 10 minutes
        cache.set(cache_key, suggestions, timeout=600)
    
    return Response({
        'query': query,
        'suggestions': suggestions,
        'count': len(suggestions)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_compare_endpoint(request):
    """
    Compare les résultats entre recherche classique et IA
    Utile pour déboguer et comprendre les différences
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    limit = int(request.GET.get('limit', 10))
    
    # Recherche classique (RAWG + base locale)
    rawg_service = RAWGAPIService()
    rawg_results = rawg_service.search_games(query, page=1, page_size=limit) or {'results': []}
    
    # Recherche sémantique IA
    semantic_results = semantic_search_games(query, limit=limit, min_similarity=0.2)
    
    return Response({
        'query': query,
        'classic_search': {
            'results': rawg_results.get('results', []),
            'count': len(rawg_results.get('results', [])),
            'source': 'rawg_api'
        },
        'semantic_search': {
            'results': semantic_results,
            'count': len(semantic_results),
            'source': 'ai_embeddings'
        },
        'comparison': {
            'classic_count': len(rawg_results.get('results', [])),
            'semantic_count': len(semantic_results),
            'ai_advantage': len(semantic_results) > len(rawg_results.get('results', []))
        }
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def ai_adaptive_search_endpoint(request):
    """
    🚀 NOUVEAU : Recherche IA avec filtres adaptatifs
    Révolution UX - Filtres naturels basés sur l'intention humaine
    """
    try:
        data = request.data
        query = data.get('query', '').strip()
        
        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupération des filtres IA
        ai_filters = data.get('ai_filters', {})
        limit = int(data.get('limit', 20))
        min_similarity = float(data.get('min_similarity', 0.3))
        
        logger.info(f"[AI ADAPTIVE SEARCH] Query: '{query}', Filters: {ai_filters}")
        
        # Cache intelligent basé sur query + filtres
        cache_key = f"ai_adaptive_{hash(f'{query}_{str(sorted(ai_filters.items()))}_{limit}')}"
        results = cache.get(cache_key)
        
        if results is None:
            # Recherche avec filtres IA adaptatifs
            results = ai_search_with_adaptive_filters(
                query=query,
                ai_filters=ai_filters,
                limit=limit,
                min_similarity=min_similarity
            )
            
            # Cache pendant 45 minutes (entre sémantique et hybride)
            cache.set(cache_key, results, timeout=2700)
        
        return Response({
            'query': query,
            'ai_filters': ai_filters,
            'results': results,
            'count': len(results),
            'search_type': 'ai_adaptive',
            'message': f"🧠 Recherche IA adaptative avec {len(ai_filters)} filtres"
        })
        
    except Exception as e:
        logger.error(f"[AI ADAPTIVE SEARCH] Erreur: {e}")
        return Response({
            'error': 'Erreur interne de recherche IA',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def ai_filter_options_endpoint(request):
    """
    Retourne les options de filtres IA disponibles pour le frontend
    """
    try:
        options = get_ai_filter_options()
        
        return Response({
            'filter_categories': list(options.keys()),
            'filters': options,
            'message': '🎯 Filtres IA adaptatifs disponibles'
        })
        
    except Exception as e:
        logger.error(f"[AI FILTER OPTIONS] Erreur: {e}")
        return Response({
            'error': 'Erreur récupération options filtres',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Debug endpoint pour tester les mappings
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def debug_ai_filters_endpoint(request):
    """
    🔧 DEBUG : Teste les mappings sémantiques
    """
    if not settings.DEBUG:
        return Response({'error': 'Debug mode only'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        data = request.data
        game_id = data.get('game_id')
        ai_filters = data.get('ai_filters', {})
        
        if not game_id:
            return Response({'error': 'game_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        game = Game.objects.get(id=game_id)
        
        from .services_ai_filters import calculate_ai_filter_score
        
        score_multiplier = calculate_ai_filter_score(game, ai_filters)
        
        return Response({
            'game': {
                'id': game.id,
                'name': game.name,
                'genres': game.genres,
                'tags': game.tags,
                'playtime': game.playtime
            },
            'ai_filters': ai_filters,
            'score_multiplier': score_multiplier,
            'explanation': f"Score multiplié par {score_multiplier:.2f}"
        })
        
    except Game.DoesNotExist:
        return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Debug error',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)