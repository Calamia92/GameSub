from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Game, Substitution, UserGame
from .serializers import (
    GameSerializer, GameSearchSerializer, SubstitutionSerializer,
    SubstitutionCreateSerializer, UserGameSerializer, UserGameCreateSerializer
)
from .services import RAWGAPIService


class GameListView(generics.ListAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSearchSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Game.objects.all()
        search = self.request.query_params.get('search')
        genre = self.request.query_params.get('genre')
        platform = self.request.query_params.get('platform')
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        if genre:
            queryset = queryset.filter(genres__icontains=genre)
        if platform:
            queryset = queryset.filter(platforms__icontains=platform)
            
        return queryset.order_by('-rating')


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
    
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)
    
    rawg_service = RAWGAPIService()
    results = rawg_service.search_games(
        query=query,
        page=page,
        genres=genres,
        platforms=platforms,
        dates=dates
    )
    
    if not results:
        return Response({'error': 'API request failed'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    for game_data in results.get('results', []):
        rawg_service.save_game_to_db(game_data)
    
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


class SubstitutionListCreateView(generics.ListCreateAPIView):
    serializer_class = SubstitutionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Récupérer l'UUID Supabase depuis l'objet user personnalisé
        user_id = getattr(self.request.user, 'id', None)
        if not user_id:
            return Substitution.objects.none()
        return Substitution.objects.filter(user_id=user_id).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubstitutionCreateSerializer
        return SubstitutionSerializer

    def perform_create(self, serializer):
        source_game_id = serializer.validated_data['source_game'].external_id
        substitute_game_id = serializer.validated_data['substitute_game'].external_id
        
        rawg_service = RAWGAPIService()
        similarity_score = rawg_service.calculate_similarity_score(
            serializer.validated_data['source_game'],
            serializer.validated_data['substitute_game']
        )
        
        # Utiliser l'UUID Supabase au lieu de l'objet User Django
        user_id = getattr(self.request.user, 'id', None)
        serializer.save(user_id=user_id, similarity_score=similarity_score)


class UserGameListCreateView(generics.ListCreateAPIView):
    serializer_class = UserGameSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Récupérer l'UUID Supabase depuis l'objet user personnalisé
        user_id = getattr(self.request.user, 'id', None)
        if not user_id:
            return UserGame.objects.none()
            
        status_filter = self.request.query_params.get('status')
        queryset = UserGame.objects.filter(user_id=user_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Utiliser l'UUID Supabase au lieu de l'objet User Django
        user_id = getattr(self.request.user, 'id', None)
        serializer.save(user_id=user_id)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserGameCreateSerializer
        return UserGameSerializer


