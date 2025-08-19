from django.contrib import admin
from .models import Game, Substitution, UserGame


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'external_id', 'rating', 'released', 'created_at']
    list_filter = ['released', 'esrb_rating', 'created_at']
    search_fields = ['name', 'slug']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Substitution)
class SubstitutionAdmin(admin.ModelAdmin):
    list_display = ['user', 'source_game', 'substitute_game', 'similarity_score', 'created_at']
    list_filter = ['created_at']
    search_fields = ['source_game__name', 'substitute_game__name', 'user__username']
    readonly_fields = ['created_at']


@admin.register(UserGame)
class UserGameAdmin(admin.ModelAdmin):
    list_display = ['user', 'game', 'status', 'rating', 'created_at']
    list_filter = ['status', 'rating', 'created_at']
    search_fields = ['user__username', 'game__name']
    readonly_fields = ['created_at', 'updated_at']
