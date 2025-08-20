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

      {groupBy === 'source' ? (
        // Groupé par jeu source
        Object.entries(groupedSubstitutes).map(([sourceGameName, data]) => (
          <div key={sourceGameName} style={{ marginBottom: '40px' }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                Substituts pour: {sourceGameName}
              </h3>
              <p style={{ color: '#666', margin: '0' }}>
                {data.substitutes.length} substitut{data.substitutes.length > 1 ? 's' : ''} trouvé{data.substitutes.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="game-grid">
              {data.substitutes.map((substitute) => (
                <div key={substitute.id} style={{ position: 'relative' }}>
                  <GameCard 
                    game={substitute.substitute_game}
                    similarityScore={substitute.similarity_score}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <div><strong>Ajouté:</strong> {formatDate(substitute.created_at)}</div>
                    {substitute.justification && (
                      <div style={{ marginTop: '5px' }}>
                        <strong>Note:</strong> {substitute.justification}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        // Groupé par date
        Object.entries(groupedSubstitutes).map(([date, subs]) => (
          <div key={date} style={{ marginBottom: '40px' }}>
            <h3 style={{
              background: '#f8f9fa',
              padding: '15px',
              margin: '0 0 20px 0',
              borderRadius: '8px',
              color: '#333'
            }}>
              {date} ({subs.length} substitut{subs.length > 1 ? 's' : ''})
            </h3>
            
            <div className="game-grid">
              {subs.map((substitute) => (
                <div key={substitute.id} style={{ position: 'relative' }}>
                  <GameCard 
                    game={substitute.substitute_game}
                    similarityScore={substitute.similarity_score}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,123,255,0.9)',
                    color: 'white',
                    padding: '5px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Substitut de: {substitute.source_game.name}
                  </div>
                  {substitute.justification && (
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {substitute.justification}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <p>Continuez à explorer de nouveaux jeux pour enrichir votre bibliothèque!</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Rechercher plus de jeux
        </button>
      </div>
    </div>
  );
};

export default MySubstitutes;