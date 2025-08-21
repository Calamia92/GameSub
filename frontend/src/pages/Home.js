import React, { useState } from 'react';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';
import SearchFilters from '../components/SearchFilters';
import { 
  SearchIcon, 
  GamepadIcon, 
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TriangleAlertIcon
} from 'lucide-react';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    genres: '',
    platforms: '',
    dates: '',
    rating: '',
    ordering: ''
  });

  const handleSearch = async (page = 1, query = null) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) {
      setError('Veuillez entrer un terme de recherche');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.searchGames(searchTerm, page, filters);
      setSearchResults(response.results || []);
      setCurrentPage(page);
      setTotalPages(Math.ceil(response.count / 20) || 1);
    } catch (err) {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleSearch(newPage);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Relancer automatiquement la recherche si on a une requête
    if (searchQuery.trim()) {
      setCurrentPage(1);
      handleSearch(1);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      genres: '',
      platforms: '',
      dates: '',
      rating: '',
      ordering: ''
    };
    setFilters(clearedFilters);
    // Relancer la recherche avec les filtres effacés
    if (searchQuery.trim()) {
      handleSearch(1);
    }
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
          Trouvez des alternatives à vos jeux favoris grâce à notre intelligence artificielle.
          Explorez de nouveaux mondes similaires à ceux que vous aimez déjà.
        </p>
      </div>

      {/* Search Section */}
      <div className="card max-w-4xl mx-auto">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                placeholder="Recherchez un jeu... (ex: The Witcher, FIFA, Minecraft)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>Recherche en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <SearchIcon className="w-5 h-5" />
                  <span>Rechercher</span>
                </div>
              )}
            </button>
          </form>

          {/* Popular Searches */}
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">Recherches populaires :</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(1, search);
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

      {/* Filters Section - Show when search query exists or filters are active */}
      {(searchQuery.trim() !== '' || Object.values(filters).some(f => f !== '')) && (
        <div className="max-w-6xl mx-auto">
          <SearchFilters
            filters={filters}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <TriangleAlertIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Results Section */}
      {searchResults.length > 0 && !loading && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Résultats de recherche
            </h2>
            <div className="text-sm text-gray-500">
              {searchResults.length} jeu{searchResults.length > 1 ? 'x' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl">
              {searchResults.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages}
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Suivant</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !loading && searchQuery && (
        <div className="py-12">
          <GamepadIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun jeu trouvé
          </h3>
          <p className="text-gray-500 mb-6">
            Aucun résultat pour "{searchQuery}". Essayez avec un autre terme de recherche.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn-primary"
          >
            Nouvelle recherche
          </button>
        </div>
      )}

      {/* Welcome Message */}
      {!searchQuery && !loading && (
        <div className="py-16 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="bg-primary-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <SearchIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Recherchez</h3>
              <p className="text-gray-600 text-sm">
                Entrez le nom d'un jeu que vous aimez dans la barre de recherche
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <SparklesIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Découvrez</h3>
              <p className="text-gray-600 text-sm">
                Notre IA trouve des jeux similaires basés sur vos préférences
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-primary-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <GamepadIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Jouez</h3>
              <p className="text-gray-600 text-sm">
                Explorez de nouveaux mondes et vivez de nouvelles aventures
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
