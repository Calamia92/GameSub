import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Brain, 
  Clock, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ApiService from '../services/api';
import AIFilters from './AIFilters';
import { useAuth } from '../contexts/AuthContext';

const UnifiedSearch = ({ onResults, className = '' }) => {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    genres: '',
    platforms: '',
    dates: '',
    rating: '',
    ordering: ''
  });
  
  // 🚀 État pour les filtres IA adaptatifs
  const [aiFilters, setAiFilters] = useState({});
  const [showAIFilters, setShowAIFilters] = useState(false);
  
  const searchTimeout = useRef(null);
  const suggestionsRef = useRef(null);

  // Options de filtres
  const genres = [
    { id: '', name: 'Tous les genres' },
    { id: 4, name: 'Action' },
    { id: 5, name: 'RPG' },
    { id: 3, name: 'Aventure' },
    { id: 10, name: 'Stratégie' },
    { id: 2, name: 'Shooter' },
    { id: 14, name: 'Simulation' },
    { id: 51, name: 'Indé' },
    { id: 7, name: 'Puzzle' },
    { id: 1, name: 'Course' },
    { id: 15, name: 'Sport' },
    { id: 16, name: 'Horreur' }
  ];

  const platforms = [
    { id: '', name: 'Toutes les plateformes' },
    { id: 4, name: 'PC' },
    { id: 187, name: 'PlayStation 5' },
    { id: 18, name: 'PlayStation 4' },
    { id: 186, name: 'Xbox Series S/X' },
    { id: 1, name: 'Xbox One' },
    { id: 7, name: 'Nintendo Switch' },
    { id: 3, name: 'iOS' },
    { id: 21, name: 'Android' }
  ];

  const years = [
    { value: '', label: 'Toutes les années' },
    { value: '2024-01-01,2024-12-31', label: '2024' },
    { value: '2023-01-01,2023-12-31', label: '2023' },
    { value: '2022-01-01,2022-12-31', label: '2022' },
    { value: '2021-01-01,2021-12-31', label: '2021' },
    { value: '2020-01-01,2020-12-31', label: '2020' },
    { value: '2015-01-01,2019-12-31', label: '2015-2019' },
    { value: '2010-01-01,2014-12-31', label: '2010-2014' },
  ];

  const ratings = [
    { value: '', label: 'Toutes les notes' },
    { value: '4.5', label: '4.5+ (Excellent)' },
    { value: '4.0', label: '4.0+ (Très bon)' },
    { value: '3.5', label: '3.5+ (Bon)' },
    { value: '3.0', label: '3.0+ (Correct)' }
  ];

  // Charger l'historique de recherche
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history.slice(0, 5));
  }, []);

  // Suggestions en temps réel (seulement en mode IA)
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
      }, 300);
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

  const handleSearch = async (page = 1, searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      let response;
      
      if (isAIMode) {
        // 🚀 Recherche IA avec filtres adaptatifs
        const hasAIFilters = Object.keys(aiFilters).length > 0;
        
        if (hasAIFilters) {
          // Recherche IA avec filtres adaptatifs (nouvelle méthode révolutionnaire)
          response = await ApiService.aiAdaptiveSearch(searchQuery, aiFilters, 20);
        } else {
          // Recherche IA hybride classique (ancien comportement)
          response = await ApiService.hybridSearch(searchQuery, 20 * page);
        }
      } else {
        // Recherche classique avec filtres
        response = await ApiService.searchGames(searchQuery, page, filters);
      }

      // Sauvegarder dans l'historique
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      // Pagination pour recherche classique uniquement
      if (!isAIMode && response.count) {
        setTotalPages(Math.ceil(response.count / 20));
        setCurrentPage(page);
      } else {
        setTotalPages(1);
        setCurrentPage(1);
      }

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
    setCurrentPage(1);
    handleSearch(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleSearch(newPage);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(1, suggestion);
  };

  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem);
    handleSearch(1, historyItem);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // Relancer la recherche si on a une requête et qu'on n'est pas en mode IA
    if (query.trim() && !isAIMode) {
      setCurrentPage(1);
      setTimeout(() => handleSearch(1), 100);
    }
  };

  const clearFilters = () => {
    setFilters({
      genres: '',
      platforms: '',
      dates: '',
      rating: '',
      ordering: ''
    });
    
    if (query.trim() && !isAIMode) {
      setCurrentPage(1);
      setTimeout(() => handleSearch(1), 100);
    }
  };

  // 🚀 Gestionnaires pour les filtres IA adaptatifs
  const handleAIFiltersChange = (newAIFilters) => {
    setAiFilters(newAIFilters);
    
    // Relancer la recherche automatiquement si on a une requête et qu'on est en mode IA
    if (query.trim() && isAIMode) {
      setCurrentPage(1);
      setTimeout(() => handleSearch(1), 100);
    }
  };

  const clearAIFilters = () => {
    setAiFilters({});
    
    if (query.trim() && isAIMode) {
      setCurrentPage(1);
      setTimeout(() => handleSearch(1), 100);
    }
  };

  const toggleAIFilters = () => {
    setShowAIFilters(!showAIFilters);
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');
  const hasActiveAIFilters = Object.keys(aiFilters).length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Barre de recherche principale */}
      <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Toggle IA - Réservé aux utilisateurs connectés */}
          {isAuthenticated && (
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
          )}

          {/* Bouton filtres adaptatif selon le mode */}
          {isAIMode ? (
            // 🚀 Bouton Filtres IA Adaptatifs (Mode IA)
            <button
              type="button"
              onClick={toggleAIFilters}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                showAIFilters || hasActiveAIFilters
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-2 border-purple-200'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Filtres IA</span>
              {hasActiveAIFilters && (
                <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {Object.keys(aiFilters).length}
                </span>
              )}
              {showAIFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          ) : (
            // Bouton Filtres Classiques (Mode Classique)
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                hasActiveFilters
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                  {Object.values(filters).filter(f => f !== '').length}
                </span>
              )}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}

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

        {/* Mode indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isAIMode ? (
              <div className="flex items-center space-x-1 text-purple-600 text-sm">
                <Brain className="h-4 w-4" />
                <span>Mode IA sémantique actif</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-gray-600 text-sm">
                <Search className="h-4 w-4" />
                <span>Recherche classique avec filtres</span>
              </div>
            )}
          </div>

          {/* Pagination (seulement en mode classique) */}
          {!isAIMode && totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filtres avancés (masqués en mode IA) */}
        {!isAIMode && showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Filtres avancés</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Effacer</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Genre */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Genre</label>
                <select
                  value={filters.genres}
                  onChange={(e) => handleFilterChange('genres', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>{genre.name}</option>
                  ))}
                </select>
              </div>

              {/* Plateforme */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plateforme</label>
                <select
                  value={filters.platforms}
                  onChange={(e) => handleFilterChange('platforms', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {platforms.map(platform => (
                    <option key={platform.id} value={platform.id}>{platform.name}</option>
                  ))}
                </select>
              </div>

              {/* Année */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Année</label>
                <select
                  value={filters.dates}
                  onChange={(e) => handleFilterChange('dates', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {years.map(year => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Note minimale</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ratings.map(rating => (
                    <option key={rating.value} value={rating.value}>{rating.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </form>

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

      {/* 🚀 Filtres IA Adaptatifs - Révolution UX */}
      {isAIMode && (
        <AIFilters
          filters={aiFilters}
          onFiltersChange={handleAIFiltersChange}
          onClear={clearAIFilters}
          isVisible={showAIFilters}
          onToggle={toggleAIFilters}
        />
      )}
    </div>
  );
};

export default UnifiedSearch;