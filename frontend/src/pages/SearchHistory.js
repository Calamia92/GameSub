import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import { SearchIcon, ClockIcon, FilterIcon } from 'lucide-react';

const SearchHistory = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    return <div className="loading">Chargement de votre historique...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <h2>Historique de Recherche</h2>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Aucune recherche sauvegardée</h3>
          <p>Vos recherches passées apparaîtront ici pour vous permettre de les retrouver facilement.</p>
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
            Commencer une recherche
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <h2>Historique de Recherche ({history.length})</h2>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {history.map((item) => (
          <div 
            key={item.id} 
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => handleRepeatSearch(item.query, item.filters)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SearchIcon style={{ width: '20px', height: '20px', color: '#007bff' }} />
                <h3 style={{ margin: 0, color: '#333' }}>"{item.query}"</h3>
              </div>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                {item.results_count} résultat{item.results_count !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#666', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ClockIcon style={{ width: '16px', height: '16px' }} />
                <span>{formatDate(item.created_at)}</span>
              </div>
              
              {Object.keys(item.filters || {}).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FilterIcon style={{ width: '16px', height: '16px' }} />
                  <span>Filtres appliqués</span>
                </div>
              )}
            </div>

            {item.filters && Object.keys(item.filters).length > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {item.filters.genres && (
                  <span style={{
                    background: '#f8f9fa',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#495057'
                  }}>
                    Genre: {item.filters.genres}
                  </span>
                )}
                {item.filters.platforms && (
                  <span style={{
                    background: '#f8f9fa',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#495057'
                  }}>
                    Plateforme: {item.filters.platforms}
                  </span>
                )}
                {item.filters.dates && (
                  <span style={{
                    background: '#f8f9fa',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#495057'
                  }}>
                    Date: {item.filters.dates}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <p>Cliquez sur une recherche pour la répéter avec les mêmes paramètres.</p>
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
          Nouvelle recherche
        </button>
      </div>
    </div>
  );
};

export default SearchHistory;