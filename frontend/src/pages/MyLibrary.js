import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';
import LibraryFilters from '../components/LibraryFilters';
import { 
  BookOpenIcon, 
  PlusIcon, 
  SearchIcon, 
  HeartIcon, 
  GridIcon,
  ListIcon,
  FilterIcon,
  XIcon,
  EyeOffIcon 
} from 'lucide-react';

const MyLibrary = () => {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const navigate = useNavigate();
  const [libraryGames, setLibraryGames] = useState([]);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // 'library' ou 'favorites'
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    genres: [],
    platforms: [],
    years: [],
    minRating: null,
    minMetacritic: null
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const [libraryResponse, favoritesResponse] = await Promise.all([
          ApiService.getMyLibraryGames(),
          ApiService.getFavoriteGames()
        ]);
        
        setLibraryGames(libraryResponse.results || libraryResponse || []);
        setFavoriteGames(favoritesResponse.results || favoritesResponse || []);
      } catch (err) {
        setError('Erreur lors du chargement de votre bibliothèque');
        console.error('Library error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate]);

  // Filtrer les jeux selon les critères sélectionnés
  const filteredGames = useMemo(() => {
    const games = activeTab === 'library' ? libraryGames : favoriteGames;
    
    return games.filter(userGame => {
      const game = userGame.game;
      
      // Filtre par genres
      if (filters.genres.length > 0) {
        const gameGenres = game.genres?.map(g => g.name || g) || [];
        if (!filters.genres.some(genre => gameGenres.includes(genre))) {
          return false;
        }
      }
      
      // Filtre par plateformes
      if (filters.platforms.length > 0) {
        const gamePlatforms = game.platforms?.map(p => p.platform?.name || p.name || p) || [];
        if (!filters.platforms.some(platform => gamePlatforms.includes(platform))) {
          return false;
        }
      }
      
      // Filtre par années
      if (filters.years.length > 0) {
        const gameYear = game.released ? new Date(game.released).getFullYear() : null;
        if (!gameYear || !filters.years.includes(gameYear)) {
          return false;
        }
      }
      
      // Filtre par note minimale
      if (filters.minRating) {
        if (!game.rating || game.rating < filters.minRating) {
          return false;
        }
      }
      
      // Filtre par score Metacritic minimal
      if (filters.minMetacritic) {
        if (!game.metacritic || game.metacritic < filters.minMetacritic) {
          return false;
        }
      }
      
      return true;
    });
  }, [libraryGames, favoriteGames, activeTab, filters]);
  
  const currentGames = filteredGames;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await ApiService.searchGames(searchQuery);
      setSearchResults(results.results || []);
    } catch (err) {
      console.error('Search error:', err);
      showError('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  };

  const handleAddToLibrary = async (game) => {
    try {
      await ApiService.addGameFromAPI(game.id, true);
      // Actualiser la bibliothèque
      const response = await ApiService.getMyLibraryGames();
      setLibraryGames(response.results || response || []);
      showSuccess(`${game.name} ajouté à votre bibliothèque !`);
    } catch (err) {
      console.error('Add to library error:', err);
      showError('Erreur lors de l\'ajout à la bibliothèque');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Chargement de votre bibliothèque...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Ma Bibliothèque</h1>
              <p className="text-gray-600">Gérez votre collection de jeux personnelle</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Ajouter un jeu</span>
            </button>
          </div>

          {/* Onglets et contrôles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Onglets */}
              <div className="flex bg-gray-100 rounded-md p-1 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'library'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpenIcon className="w-4 h-4" />
                  <span>Bibliothèque</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {libraryGames.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'favorites'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <HeartIcon className="w-4 h-4" />
                  <span>Favoris</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {favoriteGames.length}
                  </span>
                </button>
              </div>

              {/* Contrôles d'affichage */}
              <div className="flex items-center space-x-4">
                {/* Bouton filtres */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    showFilters
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FilterIcon className="w-4 h-4" />
                  <span>Filtres</span>
                  {Object.values(filters).some(f => f && (Array.isArray(f) ? f.length > 0 : true)) && (
                    <span className="bg-primary-600 text-white px-1.5 py-0.5 rounded-full text-xs">
                      {[
                        ...(filters.genres || []),
                        ...(filters.platforms || []),
                        ...(filters.years || []),
                        ...(filters.minRating ? [1] : []),
                        ...(filters.minMetacritic ? [1] : [])
                      ].length}
                    </span>
                  )}
                </button>
                
                {currentGames.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Vue :</span>
                    <div className="bg-gray-100 rounded-md p-1 flex">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded text-sm transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <GridIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded text-sm transition-colors ${
                          viewMode === 'list'
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <ListIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un jeu</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher un jeu par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? (
                  <div className="loading-spinner" />
                ) : (
                  <SearchIcon className="w-4 h-4" />
                )}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Résultats de recherche ({searchResults.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                  {searchResults.slice(0, 10).map((game) => (
                    <div key={game.id} className="relative group">
                      <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        {game.background_image && (
                          <img
                            src={game.background_image}
                            alt={game.name}
                            className="w-full h-24 object-cover rounded-md mb-2"
                          />
                        )}
                        <h5 className="text-sm font-medium text-gray-900 truncate" title={game.name}>
                          {game.name}
                        </h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {game.rating ? `⭐ ${game.rating}/5` : 'Non noté'}
                        </p>
                        <button
                          onClick={() => handleAddToLibrary(game)}
                          className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                          title="Ajouter à la bibliothèque"
                        >
                          <PlusIcon className="w-3 h-3" />
                          <span>Ajouter</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Layout principal avec sidebar de filtres */}
        <div className="flex gap-6">
          {/* Sidebar des filtres */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <LibraryFilters
                games={activeTab === 'library' ? libraryGames : favoriteGames}
                filters={filters}
                onFiltersChange={setFilters}
                onClear={() => setFilters({
                  genres: [],
                  platforms: [],
                  years: [],
                  minRating: null,
                  minMetacritic: null
                })}
              />
            </div>
          )}
          
          {/* Contenu principal */}
          <div className="flex-1">
            {/* Indicateur de résultats filtrés */}
            {(activeTab === 'library' ? libraryGames : favoriteGames).length !== currentGames.length && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 text-blue-800">
                  <FilterIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {currentGames.length} jeu{currentGames.length > 1 ? 'x' : ''} sur{' '}
                    {activeTab === 'library' ? libraryGames.length : favoriteGames.length}
                    {currentGames.length === 0 && ' - Aucun jeu ne correspond aux filtres'}
                  </span>
                </div>
              </div>
            )}
            
            {currentGames.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="mb-4">
                    {(activeTab === 'library' ? libraryGames : favoriteGames).length === 0 ? (
                      activeTab === 'library' ? (
                        <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto" />
                      ) : (
                        <HeartIcon className="w-12 h-12 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <EyeOffIcon className="w-12 h-12 text-gray-300 mx-auto" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {(activeTab === 'library' ? libraryGames : favoriteGames).length === 0
                      ? (activeTab === 'library' ? 'Aucun jeu dans votre bibliothèque' : 'Aucun jeu favori')
                      : 'Aucun jeu ne correspond aux filtres'
                    }
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {(activeTab === 'library' ? libraryGames : favoriteGames).length === 0
                      ? (activeTab === 'library' 
                          ? 'Commencez à construire votre collection en ajoutant vos jeux préférés.'
                          : 'Marquez des jeux comme favoris en cliquant sur le cœur lors de vos recherches.'
                        )
                      : 'Essayez de modifier ou supprimer certains filtres pour voir plus de jeux.'
                    }
                  </p>
                  {(activeTab === 'library' ? libraryGames : favoriteGames).length === 0 ? (
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="btn-primary"
                    >
                      {activeTab === 'library' ? 'Ajouter des jeux' : 'Découvrir des jeux'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setFilters({
                        genres: [],
                        platforms: [],
                        years: [],
                        minRating: null,
                        minMetacritic: null
                      })}
                      className="btn-outline"
                    >
                      Effacer tous les filtres
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? `grid gap-4 ${
                    showFilters 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  }`
                : 'space-y-3'
              }>
                {currentGames.map((userGame) => (
                  viewMode === 'grid' ? (
                    <GameCard 
                      key={userGame.id} 
                      game={userGame.game}
                      showLibraryBadge={true}
                      compact={true}
                    />
                  ) : (
                    <div key={userGame.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        {userGame.game.background_image && (
                          <img
                            src={userGame.game.background_image}
                            alt={userGame.game.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {userGame.game.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {userGame.game.rating ? `⭐ ${userGame.game.rating}/5` : 'Non noté'}
                          </p>
                          {userGame.game.genres && userGame.game.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {userGame.game.genres.slice(0, 2).map((genre) => (
                                <span key={genre.id || genre.name || genre} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {genre.name || genre}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLibrary;