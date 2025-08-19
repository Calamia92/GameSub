from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Game(models.Model):
    external_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, null=True)
    released = models.DateField(blank=True, null=True)
    rating = models.FloatField(blank=True, null=True)
    metacritic = models.IntegerField(blank=True, null=True)
    playtime = models.IntegerField(blank=True, null=True)
    esrb_rating = models.CharField(max_length=50, blank=True, null=True)
    background_image = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    genres = models.JSONField(default=list, blank=True)
    platforms = models.JSONField(default=list, blank=True)
    stores = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'games'

    def __str__(self):
        return self.name


class Substitution(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    source_game = models.ForeignKey(Game, related_name='source_substitutions', on_delete=models.CASCADE)
    substitute_game = models.ForeignKey(Game, related_name='substitute_substitutions', on_delete=models.CASCADE)
    justification = models.TextField(blank=True, null=True)
    similarity_score = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'substitutions'
        unique_together = ('user', 'source_game', 'substitute_game')

    def __str__(self):
        return f"{self.source_game.name} -> {self.substitute_game.name}"


class UserGame(models.Model):
    FAVORITE = 'favorite'
    WISHLIST = 'wishlist'
    PLAYED = 'played'
    
    STATUS_CHOICES = [
        (FAVORITE, 'Favorite'),
        (WISHLIST, 'Wishlist'),
        (PLAYED, 'Played'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    rating = models.IntegerField(
        blank=True, 
        null=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_games'
        unique_together = ('user', 'game', 'status')

    def __str__(self):
        return f"{self.user.username} - {self.game.name} ({self.status})"
