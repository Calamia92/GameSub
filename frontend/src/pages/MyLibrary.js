import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';
import { BookOpenIcon, PlusIcon, SearchIcon, HeartIcon } from 'lucide-react';

const MyLibrary = () => {
  const { isAuthenticated } = useAuth();
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await ApiService.searchGames(searchQuery);
      setSearchResults(results.results || []);
    } catch (err) {
      console.error('Search error:', err);
      alert('Erreur lors de la recherche');
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
      alert(`${game.name} ajouté à votre bibliothèque !`);
    } catch (err) {
      console.error('Add to library error:', err);
      alert('Erreur lors de l\'ajout à la bibliothèque');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="loading">Chargement de votre bibliothèque...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const currentGames = activeTab === 'library' ? libraryGames : favoriteGames;

  return (
    <div>
      {/* En-tête avec onglets */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Ma Bibliothèque de Jeux</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            Ajouter un jeu
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f1f3f4' }}>
          <button
            onClick={() => setActiveTab('library')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'library' ? '2px solid #007bff' : '2px solid transparent',
              color: activeTab === 'library' ? '#007bff' : '#666',
              fontWeight: activeTab === 'library' ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BookOpenIcon style={{ width: '16px', height: '16px' }} />
            Bibliothèque ({libraryGames.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'favorites' ? '2px solid #007bff' : '2px solid transparent',
              color: activeTab === 'favorites' ? '#007bff' : '#666',
              fontWeight: activeTab === 'favorites' ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <HeartIcon style={{ width: '16px', height: '16px' }} />
            Favoris ({favoriteGames.length})
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3>Rechercher un jeu à ajouter</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Nom du jeu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <SearchIcon style={{ width: '16px', height: '16px' }} />
              {searching ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div>
              <h4>Résultats de recherche :</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                {searchResults.slice(0, 8).map((game) => (
                  <div key={game.id} style={{ position: 'relative' }}>
                    <GameCard game={game} />
                    <button
                      onClick={() => handleAddToLibrary(game)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Ajouter à la bibliothèque"
                    >
                      <PlusIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenu principal */}
      {currentGames.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>
              {activeTab === 'library' ? 'Aucun jeu dans votre bibliothèque' : 'Aucun jeu favori'}
            </h3>
            <p>
              {activeTab === 'library' 
                ? 'Ajoutez des jeux à votre bibliothèque personnelle pour les retrouver facilement.'
                : 'Marquez des jeux comme favoris pour les retrouver rapidement.'
              }
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            >
              {activeTab === 'library' ? 'Ajouter des jeux' : 'Rechercher des jeux'}
            </button>
          </div>
        </div>
      ) : (
        <div className="game-grid">
          {currentGames.map((userGame) => (
            <GameCard 
              key={userGame.id} 
              game={userGame.game}
              showLibraryBadge={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLibrary;