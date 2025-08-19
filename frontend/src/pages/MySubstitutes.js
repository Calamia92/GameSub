import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';

const MySubstitutes = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState('source'); // 'source' or 'date'

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
    return <div className="loading">Chargement de vos substituts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (substitutes.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <h2>Mes Substituts</h2>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Aucun substitut sauvegardé</h3>
          <p>Recherchez des jeux et découvrez des alternatives pour commencer à construire votre bibliothèque!</p>
          <button 
            onClick={() => navigate('/')}
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
            Rechercher des jeux
          </button>
        </div>
      </div>
    );
  }

  const groupedSubstitutes = groupSubstitutes(substitutes, groupBy);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <h2>Mes Substituts ({substitutes.length})</h2>
        <div>
          <label style={{ marginRight: '10px' }}>Grouper par:</label>
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="source">Jeu source</option>
            <option value="date">Date d'ajout</option>
          </select>
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