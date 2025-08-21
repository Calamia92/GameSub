from django.core.management.base import BaseCommand
from django.core.cache import cache
from django.conf import settings
import redis
from decouple import config

class Command(BaseCommand):
    help = 'Surveille et nettoie le cache Redis pour rester sous 30MB'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Nettoie le cache si nécessaire',
        )
        parser.add_argument(
            '--stats',
            action='store_true',
            help='Affiche les stats du cache',
        )

    def handle(self, *args, **options):
        redis_url = config("REDIS_URL", default=None)
        if not redis_url:
            self.stdout.write(
                self.style.WARNING('Redis non configure ou en mode DEBUG, utilisation du cache local')
            )
            return

        try:
            # Connexion directe à Redis pour les stats
            redis_url = config("REDIS_URL")
            r = redis.from_url(redis_url, decode_responses=True)
            
            # Statistiques mémoire
            info = r.info('memory')
            used_memory = info.get('used_memory', 0)
            used_memory_mb = used_memory / (1024 * 1024)
            max_memory = 30  # MB du plan gratuit
            
            self.stdout.write(f"Redis Stats:")
            self.stdout.write(f"   Memoire utilisee: {used_memory_mb:.2f} MB / {max_memory} MB")
            self.stdout.write(f"   Utilisation: {(used_memory_mb/max_memory)*100:.1f}%")
            
            # Compte des cles
            total_keys = r.dbsize()
            gamesub_keys = len(r.keys('gs:*'))  # Nos cles avec prefixe
            
            self.stdout.write(f"   Cles totales: {total_keys}")
            self.stdout.write(f"   Cles GameSub: {gamesub_keys}")
            
            # Alerte si proche de la limite
            if used_memory_mb > 25:  # 83% de 30MB
                self.stdout.write(
                    self.style.WARNING(f"Alerte: Proche de la limite ({used_memory_mb:.1f}MB)")
                )
                
                if options['clean']:
                    self.clean_cache(r)
            elif used_memory_mb > 20:  # 67% de 30MB
                self.stdout.write(
                    self.style.WARNING(f"Attention: {used_memory_mb:.1f}MB utilises")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"Memoire OK: {used_memory_mb:.1f}MB")
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur Redis: {e}')
            )

    def clean_cache(self, redis_client):
        """Nettoie le cache de maniere intelligente"""
        self.stdout.write("Nettoyage du cache...")
        
        # 1. Nettoie les cles expirees
        self.stdout.write("   Suppression des cles expirees...")
        
        # 2. Supprime les anciennes recherches en priorite
        search_keys = redis_client.keys('gs:*games*')
        if search_keys:
            deleted = redis_client.delete(*search_keys[:len(search_keys)//2])
            self.stdout.write(f"   Supprime {deleted} recherches anciennes")
        
        # 3. Supprime les caches utilisateur les plus anciens
        user_keys = redis_client.keys('gs:*ug_*')
        if user_keys:
            deleted = redis_client.delete(*user_keys[:len(user_keys)//3])
            self.stdout.write(f"   Supprime {deleted} caches utilisateur")
            
        # 4. Garde les JWKS (important pour l'auth)
        self.stdout.write("   Conservation des cles d'authentification")
        
        # Stats apres nettoyage
        info = redis_client.info('memory')
        new_memory_mb = info.get('used_memory', 0) / (1024 * 1024)
        self.stdout.write(
            self.style.SUCCESS(f"Nettoyage termine: {new_memory_mb:.2f}MB")
        )