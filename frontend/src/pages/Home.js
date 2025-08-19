import React, { useState } from 'react';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) {
      setError('Veuillez entrer un terme de recherche');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.searchGames(searchQuery, page);
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

  return (
    <div>
      <div className="search-container">
        <h2>Rechercher un jeu</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="search-input"
            placeholder="Entrez le nom d'un jeu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          Recherche en cours...
        </div>
      )}

      {searchResults.length > 0 && !loading && (
        <>
          <h3>Résultats de recherche ({searchResults.length} jeu{searchResults.length > 1 ? 'x' : ''})</h3>
          <div className="game-grid">
            {searchResults.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ margin: '0 10px', padding: '10px 20px' }}
              >
                Précédent
              </button>
              <span style={{ margin: '0 20px' }}>
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ margin: '0 10px', padding: '10px 20px' }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {searchResults.length === 0 && !loading && searchQuery && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p>Aucun jeu trouvé pour "{searchQuery}"</p>
        </div>
      )}

      {!searchQuery && !loading && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h3>Bienvenue sur GameSub!</h3>
          <p>Recherchez un jeu pour découvrir des alternatives similaires.</p>
          <p>Vous pouvez rechercher par nom, genre, plateforme ou année de sortie.</p>
        </div>
      )}
    </div>
  );
};

export default Home;