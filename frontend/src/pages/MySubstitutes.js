import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';
import {
  RotateCcwIcon,
  CalendarIcon,
  GamepadIcon,
  SortAscIcon,
  SortDescIcon,
  FilterIcon,
  StarIcon,
  SearchIcon,
  GridIcon,
  ListIcon,
  TrendingUpIcon,
  LinkIcon,
  ClockIcon
} from 'lucide-react';

const MySubstitutes = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState('source'); // 'source' or 'date'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'similarity', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterSimilarity, setFilterSimilarity] = useState(0); // 0 to 1

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchSubstitutes = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await ApiService.getUserSubstitutes();
        setSubstitutes(response.results || response || []);
      } catch (err) {
        setError('Erreur lors du chargement de vos substituts');
        console.error('My substitutes error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubstitutes();
  }, [isAuthenticated, navigate]);

  // Filtrer et trier les substituts
  const processedSubstitutes = useMemo(() => {
    let filtered = [...substitutes];
    
    // Filtrer par similarité
    if (filterSimilarity > 0) {
      filtered = filtered.filter(sub => sub.similarity_score >= filterSimilarity);
    }
    
    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'similarity':
          comparison = a.similarity_score - b.similarity_score;
          break;
        case 'name':
          comparison = a.substitute_game.name.localeCompare(b.substitute_game.name);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [substitutes, sortBy, sortOrder, filterSimilarity]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupSubstitutes = (substitutes, groupBy) => {
    if (groupBy === 'source') {
      const grouped = {};
      substitutes.forEach(sub => {
        const sourceGameName = sub.source_game.name;
        if (!grouped[sourceGameName]) {
          grouped[sourceGameName] = {
            sourceGame: sub.source_game,
            substitutes: []
          };
        }
        grouped[sourceGameName].substitutes.push(sub);
      });
      return grouped;
    }
    
    // Group by date
    const grouped = {};
    substitutes.forEach(sub => {
      const date = formatDate(sub.created_at);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(sub);
    });
    return grouped;
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Chargement de vos substituts...</p>
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

  if (substitutes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Substituts</h1>
              <p className="text-gray-600">Vos jeux de remplacement découverts</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
              <div className="mb-6">
                <RotateCcwIcon className="w-16 h-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Aucun substitut sauvegardé
              </h3>
              <p className="text-gray-600 mb-8">
                Recherchez des jeux et découvrez des alternatives pour commencer à construire votre bibliothèque!
              </p>
              <button 
                onClick={() => navigate('/')}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <SearchIcon className="w-4 h-4" />
                <span>Rechercher des jeux</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedSubstitutes = groupSubstitutes(processedSubstitutes, groupBy);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Substituts</h1>
              <p className="text-gray-600">
                {processedSubstitutes.length} substitut{processedSubstitutes.length > 1 ? 's' : ''} sauvegardé{processedSubstitutes.length > 1 ? 's' : ''}
                {substitutes.length !== processedSubstitutes.length && ` sur ${substitutes.length} au total`}
              </p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary flex items-center space-x-2"
            >
              <SearchIcon className="w-4 h-4" />
              <span>Rechercher plus de jeux</span>
            </button>
          </div>

          {/* Contrôles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Groupement et tri */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Grouper par :</span>
                  <select 
                    value={groupBy} 
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="source">Jeu source</option>
                    <option value="date">Date d'ajout</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Trier par :</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="date">Date</option>
                    <option value="similarity">Similarité</option>
                    <option value="name">Nom</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    title={`Tri ${sortOrder === 'asc' ? 'croissant' : 'décroissant'}`}
                  >
                    {sortOrder === 'asc' ? (
                      <SortAscIcon className="w-4 h-4" />
                    ) : (
                      <SortDescIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Filtres et vue */}
              <div className="flex items-center space-x-4">
                {/* Filtre similarité */}
                <div className="flex items-center space-x-2">
                  <StarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Min :</span>
                  <select
                    value={filterSimilarity}
                    onChange={(e) => setFilterSimilarity(parseFloat(e.target.value))}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={0}>Toutes</option>
                    <option value={0.5}>50%+</option>
                    <option value={0.7}>70%+</option>
                    <option value={0.8}>80%+</option>
                    <option value={0.9}>90%+</option>
                  </select>
                </div>

                {/* Mode d'affichage */}
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
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        {processedSubstitutes.length === 0 && substitutes.length > 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <FilterIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun substitut trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                Aucun substitut ne correspond aux critères sélectionnés.
              </p>
              <button 
                onClick={() => setFilterSimilarity(0)}
                className="btn-outline"
              >
                Effacer les filtres
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupBy === 'source' ? (
              // Groupé par jeu source
              Object.entries(groupedSubstitutes).map(([sourceGameName, data]) => (
                <div key={sourceGameName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* En-tête du groupe */}
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 border-b border-primary-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-200 p-2 rounded-full">
                          <GamepadIcon className="w-5 h-5 text-primary-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-primary-900">
                            Substituts pour: {sourceGameName}
                          </h3>
                          <p className="text-sm text-primary-600">
                            {data.substitutes.length} substitut{data.substitutes.length > 1 ? 's' : ''} trouvé{data.substitutes.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <LinkIcon className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  
                  {/* Grille des substituts */}
                  <div className="p-6">
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'space-y-4'
                    }>
                      {data.substitutes.map((substitute) => (
                        viewMode === 'grid' ? (
                          <div key={substitute.id} className="relative group">
                            <GameCard 
                              game={substitute.substitute_game}
                              similarityScore={substitute.similarity_score}
                              compact={true}
                            />
                            {/* Info overlay */}
                            <div className="absolute inset-x-3 bottom-3 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="flex items-center space-x-1 text-xs mb-1">
                                <ClockIcon className="w-3 h-3" />
                                <span>Ajouté {formatDate(substitute.created_at)}</span>
                              </div>
                              {substitute.justification && (
                                <p className="text-xs text-gray-200 line-clamp-2">
                                  {substitute.justification}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={substitute.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-4">
                              {substitute.substitute_game.background_image && (
                                <img
                                  src={substitute.substitute_game.background_image}
                                  alt={substitute.substitute_game.name}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {substitute.substitute_game.name}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <TrendingUpIcon className="w-3 h-3" />
                                    <span>{Math.round(substitute.similarity_score * 100)}% similaire</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>{formatDate(substitute.created_at)}</span>
                                  </div>
                                </div>
                                {substitute.justification && (
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                    {substitute.justification}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Groupé par date
              Object.entries(groupedSubstitutes).map(([date, subs]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      {date}
                    </h3>
                    <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm font-medium">
                      {subs.length} substitut{subs.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'space-y-4'
                    }>
                      {subs.map((substitute) => (
                        viewMode === 'grid' ? (
                          <div key={substitute.id} className="relative group">
                            <GameCard 
                              game={substitute.substitute_game}
                              similarityScore={substitute.similarity_score}
                              compact={true}
                            />
                            {/* Badge jeu source */}
                            <div className="absolute top-3 left-3 bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                              ↔ {substitute.source_game.name.substring(0, 15)}{substitute.source_game.name.length > 15 ? '...' : ''}
                            </div>
                            {/* Info overlay */}
                            {substitute.justification && (
                              <div className="absolute inset-x-3 bottom-3 bg-black/80 backdrop-blur-sm text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <p className="text-xs line-clamp-2">
                                  {substitute.justification}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div key={substitute.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-4">
                              {substitute.substitute_game.background_image && (
                                <img
                                  src={substitute.substitute_game.background_image}
                                  alt={substitute.substitute_game.name}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                  {substitute.substitute_game.name}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <LinkIcon className="w-3 h-3" />
                                    <span>Substitut de: {substitute.source_game.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <TrendingUpIcon className="w-3 h-3" />
                                    <span>{Math.round(substitute.similarity_score * 100)}%</span>
                                  </div>
                                </div>
                                {substitute.justification && (
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                    {substitute.justification}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pied de page */}
        {processedSubstitutes.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <p className="text-gray-600 mb-6">
                💡 <strong>Astuce :</strong> Plus vous explorez de jeux, plus vous découvrirez d'alternatives intéressantes!
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  Découvrir plus de jeux
                </button>
                <span className="text-gray-400">ou</span>
                <button 
                  onClick={() => navigate('/library')}
                  className="btn-outline"
                >
                  Voir ma bibliothèque
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubstitutes;