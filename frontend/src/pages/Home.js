import React, { useState } from 'react';
import GameCard from '../components/GameCard';
import UnifiedSearch from '../components/UnifiedSearch';
import { 
  SparklesIcon,
  Search,
  Brain,
  GamepadIcon
} from 'lucide-react';

const Home = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [searchMode, setSearchMode] = useState(null);

  const handleSearchResults = (results, mode) => {
    setSearchResults(results);
    setSearchMode(mode);
  };

  const popularSearches = ['The Witcher 3', 'Cyberpunk 2077', 'Grand Theft Auto V', 'Minecraft', 'Among Us'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-center">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          <div className="bg-primary-100 p-4 rounded-full">
            <SparklesIcon className="w-12 h-12 text-primary-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Découvrez vos prochains jeux
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Trouvez des alternatives à vos jeux favoris grâce à notre recherche intelligente.
          Explorez de nouveaux mondes similaires à ceux que vous aimez déjà.
        </p>
      </div>

      {/* Search Section */}
      <div className="card max-w-5xl mx-auto">
        <div className="p-6">
          <UnifiedSearch 
            onResults={handleSearchResults}
            className="w-full"
          />

          {/* Popular Searches */}
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">Recherches populaires :</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    // Trigger popular search through custom event
                    const searchInput = document.querySelector('input[type="text"]');
                    if (searchInput) {
                      searchInput.value = search;
                      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                      searchInput.form.dispatchEvent(new Event('submit', { bubbles: true }));
                    }
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Mode Info */}
      {searchResults && searchMode && (
        <div className="max-w-5xl mx-auto">
          <div className={`rounded-lg p-4 ${
            searchMode === 'ai' 
              ? 'bg-purple-50 border border-purple-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`${searchMode === 'ai' ? 'text-purple-600' : 'text-blue-600'}`}>
                {searchMode === 'ai' ? <Brain className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </div>
              <div>
                <h3 className={`font-medium ${
                  searchMode === 'ai' ? 'text-purple-900' : 'text-blue-900'
                }`}>
                  {searchMode === 'ai' ? 'Recherche IA Sémantique' : 'Recherche Classique'}
                </h3>
                <p className={`text-sm ${
                  searchMode === 'ai' ? 'text-purple-700' : 'text-blue-700'
                }`}>
                  {searchMode === 'ai' 
                    ? 'Résultats basés sur la compréhension sémantique et les embeddings'
                    : 'Résultats basés sur la correspondance textuelle avec filtres'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {searchResults && searchResults.results && searchResults.results.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Résultats de recherche
            </h2>
            <div className="text-sm text-gray-500">
              {searchResults.count || searchResults.results.length} jeu{(searchResults.count || searchResults.results.length) > 1 ? 'x' : ''} trouvé{(searchResults.count || searchResults.results.length) > 1 ? 's' : ''}
              {searchMode === 'ai' && (
                <span className="ml-2 text-purple-600 font-medium">
                  • Recherche intelligente activée
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl">
              {searchResults.results.map((game, index) => (
                <div key={game.id || index} className="relative">
                  <GameCard game={game} />
                  
                  {/* Badge de score de similarité pour l'IA */}
                  {searchMode === 'ai' && game.similarity_score && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      {Math.round(game.similarity_score * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchResults && searchResults.results && searchResults.results.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun résultat trouvé
          </h3>
          <p className="text-gray-600">
            Essayez avec d'autres termes de recherche ou activez le mode IA.
          </p>
        </div>
      )}

      {/* Welcome Message */}
      {!searchResults && (
        <div className="py-16 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="bg-primary-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Recherchez</h3>
              <p className="text-gray-600 text-sm">
                Entrez le nom d'un jeu dans la barre de recherche ou activez le mode IA
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">IA Sémantique</h3>
              <p className="text-gray-600 text-sm">
                Recherche intelligente qui comprend le sens : "jeux comme Zelda"
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <GamepadIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Découvrez</h3>
              <p className="text-gray-600 text-sm">
                Explorez de nouveaux jeux parmi notre base de 800+ titres
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
