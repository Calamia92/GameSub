# Amélioration scalabilité - Index critiques et optimisations
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('games', '0002_add_performance_indexes'),
    ]

    operations = [
        # 1. INDEX CRITIQUES pour user_id (performance x100)
        migrations.AddIndex(
            model_name='usergame',
            index=models.Index(fields=['user_id'], name='user_games_user_id_idx'),
        ),
        migrations.AddIndex(
            model_name='usergame',
            index=models.Index(fields=['user_id', 'status'], name='user_games_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='substitution',
            index=models.Index(fields=['user_id'], name='substitutions_user_id_idx'),
        ),
        migrations.AddIndex(
            model_name='searchhistory',
            index=models.Index(fields=['user_id'], name='search_history_user_id_idx'),
        ),
        migrations.AddIndex(
            model_name='userlibrary',
            index=models.Index(fields=['user_id'], name='user_libraries_user_id_idx'),
        ),
        
        # 2. INDEX sur created_at pour les requêtes temporelles
        migrations.AddIndex(
            model_name='usergame',
            index=models.Index(fields=['created_at'], name='user_games_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='searchhistory',
            index=models.Index(fields=['created_at'], name='search_history_created_at_idx'),
        ),
        
        # 3. INDEX composés pour requêtes fréquentes
        migrations.AddIndex(
            model_name='usergame',
            index=models.Index(fields=['game', 'status'], name='user_games_game_status_idx'),
        ),
        
        # 4. INDEX pour les recherches de jeux
        migrations.AddIndex(
            model_name='game',
            index=models.Index(fields=['name'], name='games_name_idx'),
        ),
        migrations.AddIndex(
            model_name='game',
            index=models.Index(fields=['released'], name='games_released_idx'),
        ),
    ]