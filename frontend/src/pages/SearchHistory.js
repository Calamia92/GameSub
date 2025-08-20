import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import { 
  SearchIcon, 
  ClockIcon, 
  FilterIcon, 
  CalendarIcon,
  TrendingUpIcon,
  RepeatIcon,
  TrashIcon,
  SortAscIcon,
  SortDescIcon,
  HistoryIcon
} from 'lucide-react';

const SearchHistory = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'query', 'results'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'today', 'week', 'month'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await ApiService.getSearchHistory();
        setHistory(response.results || response || []);
      } catch (err) {
        setError('Erreur lors du chargement de l\'historique');
        console.error('Search history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, navigate]);

  // Filtrer et trier l'historique
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];
    
    // Filtrer par période
    if (filterPeriod !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (filterPeriod) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.created_at) >= cutoff);
    }
    
    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at) - new Date(b.created_at);
          break;
        case 'query':
          comparison = a.query.localeCompare(b.query);
          break;
        case 'results':
          comparison = a.results_count - b.results_count;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [history, sortBy, sortOrder, filterPeriod]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleRepeatSearch = (query, filters) => {
    // Construire l'URL de recherche avec les paramètres
    const searchParams = new URLSearchParams({ q: query });
    if (filters.genres) searchParams.append('genres', filters.genres);
    if (filters.platforms) searchParams.append('platforms', filters.platforms);
    if (filters.dates) searchParams.append('dates', filters.dates);
    
    navigate(`/?${searchParams.toString()}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Chargement de votre historique...</p>
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

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique de Recherche</h1>
              <p className="text-gray-600">Retrouvez facilement vos recherches passées</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
              <div className="mb-6">
                <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Aucune recherche sauvegardée
              </h3>
              <p className="text-gray-600 mb-8">
                Vos recherches passées apparaîtront ici pour vous permettre de les retrouver facilement.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Commencer une recherche
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique de Recherche</h1>
              <p className="text-gray-600">
                {filteredAndSortedHistory.length} recherche{filteredAndSortedHistory.length > 1 ? 's' : ''} trouvée{filteredAndSortedHistory.length > 1 ? 's' : ''}
                {history.length !== filteredAndSortedHistory.length && ` sur ${history.length} au total`}
              </p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary flex items-center space-x-2"
            >
              <SearchIcon className="w-4 h-4" />
              <span>Nouvelle recherche</span>
            </button>
          </div>

          {/* Contrôles de filtrage et tri */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Filtres par période */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Période :</span>
                <div className="bg-gray-100 rounded-md p-1 flex">
                  {[
                    { value: 'all', label: 'Tout' },
                    { value: 'today', label: 'Aujourd\'hui' },
                    { value: 'week', label: '7 jours' },
                    { value: 'month', label: '30 jours' }
                  ].map(period => (
                    <button
                      key={period.value}
                      onClick={() => setFilterPeriod(period.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        filterPeriod === period.value
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="query">Recherche</option>
                  <option value="results">Nombre de résultats</option>
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
          </div>
        </div>

        {/* Liste des recherches */}
        <div className="space-y-4">
          {filteredAndSortedHistory.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
              onClick={() => handleRepeatSearch(item.query, item.filters)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="bg-primary-100 p-2 rounded-full group-hover:bg-primary-200 transition-colors">
                      <SearchIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
                        "{item.query}"
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        {Object.keys(item.filters || {}).length > 0 && (
                          <div className="flex items-center space-x-1">
                            <FilterIcon className="w-4 h-4" />
                            <span>{Object.keys(item.filters).length} filtre{Object.keys(item.filters).length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-green-600">
                        <TrendingUpIcon className="w-4 h-4" />
                        <span className="font-semibold">{item.results_count}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        résultat{item.results_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <RepeatIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Filtres appliqués */}
                {item.filters && Object.keys(item.filters).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {Object.entries(item.filters).map(([key, value]) => {
                      if (!value) return null;
                      const labels = {
                        genres: 'Genre',
                        platforms: 'Plateforme', 
                        dates: 'Période',
                        rating: 'Note',
                        ordering: 'Tri'
                      };
                      return (
                        <span 
                          key={key}
                          className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                        >
                          <FilterIcon className="w-3 h-3 mr-1" />
                          {labels[key] || key}: {value}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Bande d'action au hover */}
              <div className="bg-primary-50 px-6 py-3 border-t border-primary-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center text-primary-700 text-sm font-medium">
                  <RepeatIcon className="w-4 h-4 mr-2" />
                  Cliquer pour répéter cette recherche
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun résultat après filtrage */}
        {filteredAndSortedHistory.length === 0 && history.length > 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune recherche trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                Aucune recherche ne correspond à la période sélectionnée.
              </p>
              <button 
                onClick={() => setFilterPeriod('all')}
                className="btn-outline"
              >
                Afficher toutes les recherches
              </button>
            </div>
          </div>
        )}
        
        {/* Pied de page */}
        {filteredAndSortedHistory.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600 mb-4">
                💡 <strong>Astuce :</strong> Cliquez sur une recherche pour la répéter avec les mêmes paramètres.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                  onClick={() => navigate('/')}
                  className="btn-primary"
                >
                  Nouvelle recherche
                </button>
                <span className="text-gray-400">ou</span>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-outline"
                >
                  Actualiser l'historique
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;