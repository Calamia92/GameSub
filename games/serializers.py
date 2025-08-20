from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Game, Substitution, UserGame, SearchHistory, UserLibrary


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
    # On récupère le jeu via l'external_id au lieu de la PK
    game = serializers.SlugRelatedField(
        queryset=Game.objects.all(),
        slug_field='external_id'
    )

    class Meta:
        model = UserGame
        fields = ['game', 'status', 'rating', 'notes']


class SearchHistorySerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(read_only=True)
    
    class Meta:
        model = SearchHistory
        fields = ['id', 'user_id', 'query', 'filters', 'results_count', 'created_at']


class SearchHistoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['query', 'filters', 'results_count']


class UserLibrarySerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(read_only=True)
    games_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserLibrary
        fields = ['id', 'user_id', 'name', 'description', 'is_public', 'games_count', 'created_at', 'updated_at']
    
    def get_games_count(self, obj):
        return obj.get_games_count()


class UserLibraryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLibrary
        fields = ['name', 'description', 'is_public']


class AddGameFromAPISerializer(serializers.Serializer):
    external_id = serializers.IntegerField()
    name = serializers.CharField(max_length=255, read_only=True)
    add_to_library = serializers.BooleanField(default=True)


# Serializers pour l'authentification Django (compatibilité)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user