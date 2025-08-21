from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Game, Substitution, UserGame, SearchHistory, UserLibrary
from .models_profile import UserProfile
from django.db.models import Prefetch, Count
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from decouple import config
from django.contrib.auth.models import User
from .serializers import (
    GameSerializer, GameSearchSerializer, SubstitutionSerializer,
    SubstitutionCreateSerializer, UserGameSerializer, UserGameCreateSerializer,
    SearchHistorySerializer, SearchHistoryCreateSerializer, UserLibrarySerializer,
    UserLibraryCreateSerializer, AddGameFromAPISerializer
)
from .services import RAWGAPIService

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
    
    for game_data in results.get('results', []):
        rawg_service.save_game_to_db(game_data)
    
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

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_game_substitutes(request, game_id):
    try:
        source_game = Game.objects.get(external_id=game_id)
    except Game.DoesNotExist:
        rawg_service = RAWGAPIService()
        game_data = rawg_service.get_game_details(game_id)
        if not game_data:
            return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)
        source_game = rawg_service.save_game_to_db(game_data)
    
    rawg_service = RAWGAPIService()
    substitutes = rawg_service.find_substitutes(source_game.external_id)
    
    substitute_data = []
    for substitute in substitutes:
        similarity_score = rawg_service.calculate_similarity_score(source_game, substitute)
        substitute_info = GameSerializer(substitute).data
        substitute_info['similarity_score'] = similarity_score
        substitute_data.append(substitute_info)
    
    substitute_data.sort(key=lambda x: x['similarity_score'], reverse=True)
    
    return Response({
        'source_game': GameSerializer(source_game).data,
        'substitutes': substitute_data
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
