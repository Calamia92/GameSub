from rest_framework import serializers
from .models import Game, Substitution, UserGame


class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = [
            'id', 'external_id', 'name', 'slug', 'description', 'released',
            'rating', 'metacritic', 'playtime', 'esrb_rating', 'background_image',
            'website', 'genres', 'platforms', 'stores', 'tags', 'created_at'
        ]


class GameSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = [
            'id', 'external_id', 'name', 'slug', 'released', 'rating',
            'background_image', 'genres', 'platforms'
        ]


class SubstitutionSerializer(serializers.ModelSerializer):
    source_game = GameSerializer(read_only=True)
    substitute_game = GameSerializer(read_only=True)
    user_id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = Substitution
        fields = [
            'id', 'user_id', 'source_game', 'substitute_game', 'justification',
            'similarity_score', 'created_at'
        ]


class SubstitutionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Substitution
        fields = ['source_game', 'substitute_game', 'justification']


class UserGameSerializer(serializers.ModelSerializer):
    game = GameSearchSerializer(read_only=True)
    user_id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = UserGame
        fields = [
            'id', 'user_id', 'game', 'status', 'rating', 'notes',
            'created_at', 'updated_at'
        ]


class UserGameCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGame
        fields = ['game', 'status', 'rating', 'notes']