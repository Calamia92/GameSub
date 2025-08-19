from rest_framework import serializers
from django.contrib.auth.models import User
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
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Substitution
        fields = [
            'id', 'user', 'source_game', 'substitute_game', 'justification',
            'similarity_score', 'created_at'
        ]


class SubstitutionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Substitution
        fields = ['source_game', 'substitute_game', 'justification']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UserGameSerializer(serializers.ModelSerializer):
    game = GameSearchSerializer(read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = UserGame
        fields = [
            'id', 'user', 'game', 'status', 'rating', 'notes',
            'created_at', 'updated_at'
        ]


class UserGameCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGame
        fields = ['game', 'status', 'rating', 'notes']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
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
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user