from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from games.models import SearchHistory

class Command(BaseCommand):
    help = 'Nettoie automatiquement l\'historique de recherche'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Nombre de jours à conserver (défaut: 30)'
        )
        parser.add_argument(
            '--max-per-user',
            type=int,
            default=50,
            help='Nombre max de recherches par utilisateur (défaut: 50)'
        )

    def handle(self, *args, **options):
        days = options['days']
        max_per_user = options['max_per_user']
        
        self.stdout.write(f'Nettoyage de l\'historique de recherche...')
        self.stdout.write(f'- Suppression des recherches > {days} jours')
        self.stdout.write(f'- Conservation max {max_per_user} recherches par utilisateur')
        
        # Supprime les anciennes recherches
        cutoff_date = timezone.now() - timedelta(days=days)
        old_searches = SearchHistory.objects.filter(created_at__lt=cutoff_date)
        old_count = old_searches.count()
        old_searches.delete()
        
        self.stdout.write(f'[OK] {old_count} anciennes recherches supprimees')
        
        # Limite le nombre de recherches par utilisateur
        from django.db import connection
        with connection.cursor() as cursor:
            # Requête pour garder seulement les N dernières recherches par utilisateur
            cursor.execute("""
                DELETE FROM search_history 
                WHERE id NOT IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER (
                            PARTITION BY user_id 
                            ORDER BY created_at DESC
                        ) as rn
                        FROM search_history
                    ) ranked 
                    WHERE rn <= %s
                )
            """, [max_per_user])
            
            excess_count = cursor.rowcount
            self.stdout.write(f'[OK] {excess_count} recherches en exces supprimees')
        
        # Statistiques finales
        total_remaining = SearchHistory.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f'[SUCCESS] Nettoyage termine. {total_remaining} recherches conservees.'
            )
        )