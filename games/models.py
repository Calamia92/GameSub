from django.db import models
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
        indexes = [
            models.Index(fields=['rating'], name='games_rating_idx'),
            models.Index(fields=['external_id'], name='games_external_id_idx'),
        ]

    def __str__(self):
        return self.name


class Substitution(models.Model):
    user_id = models.UUIDField()  # UUID de l'utilisateur Supabase
    source_game = models.ForeignKey(Game, related_name='source_substitutions', on_delete=models.CASCADE)
    substitute_game = models.ForeignKey(Game, related_name='substitute_substitutions', on_delete=models.CASCADE)
    justification = models.TextField(blank=True, null=True)
    similarity_score = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'substitutions'
        unique_together = ('user_id', 'source_game', 'substitute_game')

    def __str__(self):
        return f"{self.source_game.name} -> {self.substitute_game.name} (User: {self.user_id})"


class UserGame(models.Model):
    FAVORITE = 'favorite'
    WISHLIST = 'wishlist'
    PLAYED = 'played'
    LIBRARY = 'library'
    
    STATUS_CHOICES = [
        (FAVORITE, 'Favorite'),
        (WISHLIST, 'Wishlist'),
        (PLAYED, 'Played'),
        (LIBRARY, 'Library'),
    ]

    user_id = models.UUIDField()  # UUID de l'utilisateur Supabase
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
        unique_together = ('user_id', 'game')

    def __str__(self):
        return f"User {self.user_id} - {self.game.name} ({self.status})"


class SearchHistory(models.Model):
    user_id = models.UUIDField()  # UUID de l'utilisateur Supabase
    query = models.CharField(max_length=255)
    filters = models.JSONField(default=dict, blank=True)  # genres, platforms, dates
    results_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'search_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"User {self.user_id} searched '{self.query}'"


class UserLibrary(models.Model):
    user_id = models.UUIDField()  # UUID de l'utilisateur Supabase
    name = models.CharField(max_length=255, default="Ma Bibliothèque")
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_libraries'
        unique_together = ('user_id', 'name')

    def __str__(self):
        return f"Library '{self.name}' by User {self.user_id}"

    def get_games_count(self):
        return UserGame.objects.filter(user_id=self.user_id, status='library').count()


# Import du profil utilisateur à la fin pour éviter les imports circulaires
from .models_profile import UserProfile
