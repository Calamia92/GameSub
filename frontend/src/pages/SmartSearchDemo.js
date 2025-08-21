import React, { useState } from 'react';
import UnifiedSearch from '../components/UnifiedSearch';
import GameCard from '../components/GameCard';
import { Brain, Search, Zap, TrendingUp, Target, Info } from 'lucide-react';

const SmartSearchDemo = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [searchMode, setSearchMode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchResults = (results, mode) => {
    setSearchResults(results);
    setSearchMode(mode);
    setIsLoading(false);
  };

  const exampleQueries = [
    {
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      query: "jeux comme Zelda",
      description: "Recherche sémantique pour des jeux similaires"
    },
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      query: "RPG sombre et mature",
      description: "Recherche par ambiance et style"
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      query: "space exploration indie",
      description: "Recherche par thématique et genre"
    },
    {
      icon: <Target className="h-5 w-5 text-red-500" />,
      query: "jeux de survie multijoueur",
      description: "Recherche par mécaniques de jeu"
    }
  ];

  const getModeInfo = () => {
    if (searchMode === 'ai') {
      return {
        title: 'Recherche IA Sémantique',
        description: 'Résultats basés sur la compréhension sémantique et les embeddings',
        color: 'purple',
        icon: <Brain className="h-5 w-5" />
      };
    } else if (searchMode === 'classic') {
      return {
        title: 'Recherche Classique',
        description: 'Résultats basés sur la correspondance textuelle',
        color: 'blue',
        icon: <Search className="h-5 w-5" />
      };
    }
    return null;
  };

  const modeInfo = getModeInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧠 Recherche IA Sémantique
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre nouvelle fonctionnalité de recherche alimentée par l'intelligence artificielle. 
            Recherchez par concepts, ambiances, ou similarités plutôt que par mots-clés exacts.
          </p>
        </div>

        {/* Exemples de requêtes */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exemples de recherches IA :</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleQueries.map((example, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => {
                  // Remplir automatiquement le champ de recherche
                  const searchInput = document.querySelector('input[type="text"]');
                  if (searchInput) {
                    searchInput.value = example.query;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    // Activer le mode IA pour ces exemples
                    const aiToggle = document.querySelector('button[type="button"]');
                    if (aiToggle && !aiToggle.parentElement.querySelector('.bg-purple-600')) {
                      aiToggle.click();
                    }
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  {example.icon}
                  <div>
                    <div className="font-medium text-gray-900">"{example.query}"</div>
                    <div className="text-sm text-gray-600">{example.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interface de recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <UnifiedSearch 
            onResults={handleSearchResults}
            className="w-full"
          />
        </div>

        {/* Info sur le mode de recherche */}
        {modeInfo && (
          <div className={`bg-${modeInfo.color}-50 border border-${modeInfo.color}-200 rounded-lg p-4 mb-6`}>
            <div className="flex items-center space-x-2">
              <div className={`text-${modeInfo.color}-600`}>
                {modeInfo.icon}
              </div>
              <div>
                <h3 className={`font-medium text-${modeInfo.color}-900`}>{modeInfo.title}</h3>
                <p className={`text-sm text-${modeInfo.color}-700`}>{modeInfo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Résultats de recherche */}
        {searchResults && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Résultats de recherche
              </h2>
              <div className="text-sm text-gray-600">
                {searchResults.count || 0} résultats trouvés
              </div>
            </div>

            {searchResults.results && searchResults.results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.results.map((game, index) => (
                  <div key={game.id || index} className="relative">
                    <GameCard game={game} />
                    
                    {/* Badge de score de similarité pour l'IA */}
                    {searchMode === 'ai' && game.similarity_score && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        {Math.round(game.similarity_score * 100)}%
                      </div>
                    )}
                    
                    {/* Badge de type de recherche */}
                    {game.search_type && (
                      <div className="absolute top-2 left-2">
                        {game.search_type === 'semantic_ai' ? (
                          <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                            IA
                          </div>
                        ) : game.search_type === 'classic_text' ? (
                          <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            Classique
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
          </div>
        )}

        {/* Section d'information */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white p-8">
          <div className="flex items-start space-x-4">
            <Info className="h-8 w-8 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-4">Comment fonctionne la recherche IA ?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm opacity-90">
                <div>
                  <h4 className="font-semibold mb-2">🧠 Compréhension sémantique</h4>
                  <p>L'IA comprend le sens de votre recherche, pas seulement les mots-clés exacts.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🎯 Recherche par similarité</h4>
                  <p>Trouve des jeux similaires même sans correspondance textuelle directe.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🚀 Embeddings vectoriels</h4>
                  <p>Utilise des modèles de langage avancés pour analyser les descriptions de jeux.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⚡ Recherche hybride</h4>
                  <p>Combine l'IA sémantique avec la recherche classique pour de meilleurs résultats.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSearchDemo;