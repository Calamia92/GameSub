#!/usr/bin/env python
"""
Script pour importer des jeux populaires depuis RAWG API

Usage:
    python import_games.py --count 10000 --strategy mixed
    python import_games.py --count 5000 --strategy popular --min-metacritic 70
    python import_games.py --count 1000 --strategy rated --min-rating 4.0
"""

import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'GameSub.settings')
django.setup()

from django.core.management import call_command
from games.models import Game

def main():
    print("🎮 GameSub - Import de jeux populaires depuis RAWG API")
    print("=" * 60)
    
    # Afficher l'état actuel de la base
    current_count = Game.objects.count()
    print(f"📊 Jeux actuellement en base: {current_count}")
    
    print("\n🚀 Stratégies d'import disponibles:")
    print("   • popular  : Jeux les plus ajoutés aux collections")
    print("   • rated    : Jeux avec les meilleures notes Metacritic")
    print("   • recent   : Jeux récents (2020-2024)")
    print("   • mixed    : Mélange des 3 stratégies (recommandé)")
    
    print("\n💡 Exemples d'utilisation:")
    print("   python import_games.py")
    print("   python manage.py import_popular_games --count 5000 --strategy mixed")
    print("   python manage.py import_popular_games --count 1000 --strategy rated --min-metacritic 80")
    
    # Demander confirmation pour un import par défaut
    print(f"\n🎯 Import par défaut: 10,000 jeux avec stratégie 'mixed'")
    response = input("Voulez-vous continuer? (y/N): ").lower().strip()
    
    if response in ['y', 'yes', 'oui']:
        print("\n🚀 Lancement de l'import...")
        try:
            call_command(
                'import_popular_games',
                count=10000,
                strategy='mixed',
                min_rating=3.0,
                min_metacritic=60,
                batch_size=20,
                delay=0.3
            )
            
            # Afficher le résultat final
            new_count = Game.objects.count()
            imported = new_count - current_count
            print(f"\n✅ Import terminé!")
            print(f"   📥 Jeux importés: {imported}")
            print(f"   📊 Total en base: {new_count}")
            
        except KeyboardInterrupt:
            print("\n❌ Import interrompu par l'utilisateur")
        except Exception as e:
            print(f"\n❌ Erreur durant l'import: {e}")
    else:
        print("\n📚 Pour un import personnalisé, utilisez:")
        print("   python manage.py import_popular_games --help")

if __name__ == "__main__":
    main()