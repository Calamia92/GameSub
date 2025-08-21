import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, ToggleLeft, ToggleRight, Brain, Clock } from 'lucide-react';
import ApiService from '../services/api';

const SmartSearch = ({ onResults, className = '' }) => {
  const [query, setQuery] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchTimeout = useRef(null);
  const suggestionsRef = useRef(null);

  // Charger l'historique de recherche depuis localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history.slice(0, 5)); // Garder seulement les 5 dernières
  }, []);

  // Suggestions en temps réel
  useEffect(() => {
    if (query.length >= 2 && isAIMode) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await ApiService.getSearchSuggestions(query, 5);
          setSuggestions(response.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Erreur suggestions:', error);
          setSuggestions([]);
        }
      }, 300); // Debounce de 300ms
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, isAIMode]);

  // Fermer suggestions en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      let response;
      
      if (isAIMode) {
        // Recherche IA hybride (sémantique + classique)
        response = await ApiService.hybridSearch(searchQuery, 20);
      } else {
        // Recherche classique
        response = await ApiService.searchGames(searchQuery, 1);
      }

      // Sauvegarder dans l'historique
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Transmettre les résultats au parent
      onResults(response, isAIMode ? 'ai' : 'classic');

    } catch (error) {
      console.error('Erreur de recherche:', error);
      onResults({ results: [], count: 0 }, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem);
    handleSearch(historyItem);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Barre de recherche principale */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center space-x-3">
          {/* Champ de recherche */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isAIMode ? 'text-purple-500' : 'text-gray-400'}`} />
            </div>
            
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={isAIMode ? "Recherche intelligente... (ex: 'jeux comme Zelda')" : "Rechercher des jeux..."}
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                isAIMode 
                  ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200 bg-purple-50' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
            />

            {/* Indicateur de chargement */}
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            )}
          </div>

          {/* Toggle IA */}
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${isAIMode ? 'text-purple-600' : 'text-gray-600'}`}>
              IA
            </span>
            <button
              type="button"
              onClick={() => setIsAIMode(!isAIMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isAIMode 
                  ? 'bg-purple-600 focus:ring-purple-500' 
                  : 'bg-gray-200 focus:ring-gray-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  isAIMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {isAIMode && (
                <Sparkles className="absolute right-1 h-3 w-3 text-white" />
              )}
            </button>
          </div>

          {/* Bouton de recherche */}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isAIMode
                ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </form>

      {/* Mode indicator */}
      <div className="mt-2 flex items-center space-x-2">
        {isAIMode ? (
          <div className="flex items-center space-x-1 text-purple-600 text-sm">
            <Brain className="h-4 w-4" />
            <span>Mode IA sémantique actif</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-gray-600 text-sm">
            <Search className="h-4 w-4" />
            <span>Recherche classique</span>
          </div>
        )}
      </div>

      {/* Suggestions et historique */}
      {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {/* Suggestions IA */}
          {isAIMode && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-purple-600 mb-2 flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Suggestions IA
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded text-sm text-gray-700 hover:text-purple-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Historique */}
          {searchHistory.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Recherches récentes
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;