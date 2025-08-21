from django.core.management.base import BaseCommand
from games.models import Game
from games.services_semantic_search import semantic_search_games
from games.services_recommendations import get_top_rated_games
from games.services_ai_filters import ai_search_with_adaptive_filters

class Command(BaseCommand):
    help = 'Test quality filter implementation'

    def handle(self, *args, **options):
        self.stdout.write("[QUALITY FILTER TEST]")
        self.stdout.write("=" * 50)
        
        # Statistiques de base
        total_games = Game.objects.count()
        quality_games = Game.objects.filter(rating__gt=0).count()
        zero_rating_games = Game.objects.filter(rating=0).count()
        
        self.stdout.write(f"Total games: {total_games}")
        self.stdout.write(f"Quality games (rating > 0): {quality_games}")
        self.stdout.write(f"Zero rating games: {zero_rating_games}")
        self.stdout.write(f"Quality percentage: {(quality_games/total_games)*100:.1f}%")
        
        # Test recherche sémantique
        self.stdout.write(f"\n[SEMANTIC SEARCH TEST]")
        semantic_results = semantic_search_games("action games", limit=5)
        self.stdout.write(f"Semantic results found: {len(semantic_results)}")
        
        for i, result in enumerate(semantic_results[:3], 1):
            name = result['name'][:30] + "..." if len(result['name']) > 30 else result['name']
            rating = result.get('rating', 'N/A')
            self.stdout.write(f"  {i}. {name} (rating: {rating})")
        
        # Vérifier qu'aucun résultat n'a rating = 0
        zero_rating_results = [r for r in semantic_results if r.get('rating') == 0]
        if zero_rating_results:
            self.stdout.write(f"[ERROR] {len(zero_rating_results)} results with rating=0 found!")
        else:
            self.stdout.write("[OK] No zero-rating games in semantic results")
        
        # Test recommandations
        self.stdout.write(f"\n[RECOMMENDATIONS TEST]")
        top_games = get_top_rated_games(5)
        self.stdout.write(f"Top rated games found: {len(top_games)}")
        
        for i, game in enumerate(top_games[:3], 1):
            name = game['name'][:30] + "..." if len(game['name']) > 30 else game['name']
            rating = game.get('rating', 'N/A')
            self.stdout.write(f"  {i}. {name} (rating: {rating})")
        
        # Test filtres IA
        self.stdout.write(f"\n[AI FILTERS TEST]")
        ai_results = ai_search_with_adaptive_filters(
            "fun games", 
            {"ambiance": "relaxing"}, 
            limit=3
        )
        self.stdout.write(f"AI filter results found: {len(ai_results)}")
        
        for i, result in enumerate(ai_results[:3], 1):
            name = result['name'][:30] + "..." if len(result['name']) > 30 else result['name']
            rating = result.get('rating', 'N/A')
            self.stdout.write(f"  {i}. {name} (rating: {rating})")
        
        # Vérifier qu'aucun résultat IA n'a rating = 0
        zero_ai_results = [r for r in ai_results if r.get('rating') == 0]
        if zero_ai_results:
            self.stdout.write(f"[ERROR] {len(zero_ai_results)} AI results with rating=0 found!")
        else:
            self.stdout.write("[OK] No zero-rating games in AI results")
        
        # Test du nouveau manager
        self.stdout.write(f"\n[MANAGER TEST]")
        quality_manager_count = Game.quality.count()
        self.stdout.write(f"Game.quality.count(): {quality_manager_count}")
        
        if quality_manager_count == quality_games:
            self.stdout.write("[OK] Quality manager working correctly")
        else:
            self.stdout.write(f"[ERROR] Quality manager mismatch: {quality_manager_count} vs {quality_games}")
        
        self.stdout.write("\n" + "=" * 50)
        
        # Résumé final
        all_tests_passed = (
            len(zero_rating_results) == 0 and
            len(zero_ai_results) == 0 and
            quality_manager_count == quality_games
        )
        
        if all_tests_passed:
            self.stdout.write(self.style.SUCCESS("[SUCCESS] All quality filter tests passed!"))
        else:
            self.stdout.write(self.style.ERROR("[FAILED] Some quality filter tests failed!"))