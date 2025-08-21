from django.urls import path, include
from . import views

app_name = 'games'

urlpatterns = [
    path('games/', views.GameListView.as_view(), name='game-list'),
    path('games/<int:pk>/', views.GameDetailView.as_view(), name='game-detail'),
    path('search/', views.search_games_api, name='search-games'),
    path('substitutes/<int:game_id>/', views.get_game_substitutes, name='game-substitutes'),
    path('my-substitutes/', views.SubstitutionListCreateView.as_view(), name='my-substitutes'),
    path('my-games/', views.UserGameListCreateView.as_view(), name='my-games'),
    # path('ai-quiz/', views.AIDynamicQuizView.as_view(), name='ai-quiz'),
    # path("recommend/", views.AIRecommendationView.as_view(), name="ai-recommend"),
]