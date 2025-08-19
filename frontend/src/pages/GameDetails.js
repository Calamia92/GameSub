import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';

const GameDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [gameData, setGameData] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingSubstitute, setSavingSubstitute] = useState(null);

  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await ApiService.getGameSubstitutes(id);
        setGameData(response.source_game);
        setSubstitutes(response.substitutes || []);
      } catch (err) {
        setError('Erreur lors du chargement des données du jeu');
        console.error('Game details error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id]);

  const saveSubstitute = async (substitute) => {
    if (!isAuthenticated) {
      alert('Vous devez être connecté pour sauvegarder des substituts');
      return;
    }

    setSavingSubstitute(substitute.id);
    
    try {
      await ApiService.saveSubstitute(
        gameData.id,
        substitute.id,
        `Substitut suggéré avec ${Math.round(substitute.similarity_score * 100)}% de similarité`
      );
      alert('Substitut sauvegardé avec succès!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        alert('Ce substitut est déjà dans votre bibliothèque');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
      console.error('Save substitute error:', err);
    } finally {
      setSavingSubstitute(null);
    }
  };

  if (loading) {
    return <div className="loading">Chargement des détails du jeu...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!gameData) {
    return <div className="error">Jeu introuvable</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getGenreNames = (genres) => {
    if (!genres || genres.length === 0) return 'Non spécifié';
    return genres.map(genre => genre.name).join(', ');
  };

  const getPlatformNames = (platforms) => {
    if (!platforms || platforms.length === 0) return 'Non spécifié';
    return platforms.map(platform => platform.name).join(', ');
  };

  const getStoreLinks = (stores) => {
    if (!stores || stores.length === 0) return null;
    return stores.map(store => (
      <a 
        key={store.id}
        href={store.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ 
          margin: '0 10px 0 0', 
          padding: '5px 10px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        {store.name}
      </a>
    ));
  };

  return (
    <div>
      {/* Détails du jeu principal */}
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px' 
      }}>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          {gameData.background_image && (
            <img 
              src={gameData.background_image}
              alt={gameData.name}
              style={{ 
                width: '300px', 
                height: '200px', 
                objectFit: 'cover',
                borderRadius: '8px' 
              }}
            />
          )}
          
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1>{gameData.name}</h1>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Genres:</strong> {getGenreNames(gameData.genres)}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Plateformes:</strong> {getPlatformNames(gameData.platforms)}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Date de sortie:</strong> {formatDate(gameData.released)}
            </div>
            
            {gameData.rating && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Note:</strong> ⭐ {gameData.rating}/5
              </div>
            )}
            
            {gameData.metacritic && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Metacritic:</strong> {gameData.metacritic}/100
              </div>
            )}
            
            {gameData.playtime && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Durée moyenne:</strong> {gameData.playtime}h
              </div>
            )}
            
            {gameData.esrb_rating && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Classification ESRB:</strong> {gameData.esrb_rating}
              </div>
            )}
            
            {gameData.stores && gameData.stores.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Disponible sur:</strong><br />
                <div style={{ marginTop: '10px' }}>
                  {getStoreLinks(gameData.stores)}
                </div>
              </div>
            )}
            
            {gameData.website && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Site officiel:</strong>{' '}
                <a 
                  href={gameData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#007bff' }}
                >
                  Visiter
                </a>
              </div>
            )}
          </div>
        </div>
        
        {gameData.description && (
          <div style={{ marginTop: '20px' }}>
            <h3>Description</h3>
            <p style={{ lineHeight: '1.6', color: '#555' }}>
              {gameData.description}
            </p>
          </div>
        )}
      </div>

      {/* Substituts suggérés */}
      <div>
        <h2>Jeux similaires recommandés ({substitutes.length})</h2>
        
        {substitutes.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p>Aucun substitut trouvé pour ce jeu.</p>
          </div>
        ) : (
          <div className="game-grid">
            {substitutes.map((substitute) => (
              <div key={substitute.id} style={{ position: 'relative' }}>
                <GameCard 
                  game={substitute} 
                  similarityScore={substitute.similarity_score} 
                />
                {isAuthenticated && (
                  <button
                    onClick={() => saveSubstitute(substitute)}
                    disabled={savingSubstitute === substitute.id}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {savingSubstitute === substitute.id ? '...' : '💾 Sauvegarder'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!isAuthenticated && substitutes.length > 0 && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            color: '#856404',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <p>Connectez-vous pour sauvegarder vos substituts favoris!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;