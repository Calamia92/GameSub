from django.urls import path
from . import views

app_name = 'games'

urlpatterns = [
    # Games
    path('games/', views.GameListView.as_view(), name='game-list'),
    path('games/<int:pk>/', views.GameDetailView.as_view(), name='game-detail'),
    path('search/', views.search_games_api, name='search-games'),
    path('substitutes/<int:game_id>/', views.get_game_substitutes, name='game-substitutes'),

    # User Games & Substitutes
    path('my-substitutes/', views.SubstitutionListCreateView.as_view(), name='my-substitutes'),
    path('my-games/', views.UserGameListCreateView.as_view(), name='my-games'),
    path('substitutes_library_fav/', views.get_library_recommendations, name='library-recommendations'),

    # Search History
    path('my-search-history/', views.SearchHistoryListView.as_view(), name='my-search-history'),
    
    # User Library
    path('my-library/', views.UserLibraryListCreateView.as_view(), name='my-library'),
    path('my-library/<int:pk>/', views.UserLibraryDetailView.as_view(), name='library-detail'),
    path('library/<int:library_id>/games/', views.get_library_games, name='library-games'),
    
    # Add games from API
    path('add-game-from-api/', views.add_game_from_api, name='add-game-from-api'),
    
    # Profile Management
    path('profile/', views.user_profile, name='user-profile'),
    path('profile/stats/', views.user_stats, name='user-stats'),
]