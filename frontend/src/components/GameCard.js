import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ game, similarityScore = null }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/game/${game.external_id || game.id}`);
  };

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
    return platforms.slice(0, 3).map(platform => platform.name).join(', ');
  };

  return (
    <div className="game-card" onClick={handleClick}>
      {game.background_image && (
        <img 
          src={game.background_image} 
          alt={game.name}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="game-card-content">
        <h3>{game.name}</h3>
        {similarityScore !== null && (
          <p style={{ color: '#007bff', fontWeight: 'bold' }}>
            Similarité: {Math.round(similarityScore * 100)}%
          </p>
        )}
        <p><strong>Genres:</strong> {getGenreNames(game.genres)}</p>
        <p><strong>Plateformes:</strong> {getPlatformNames(game.platforms)}</p>
        <p><strong>Date de sortie:</strong> {formatDate(game.released)}</p>
        {game.rating && (
          <p><strong>Note:</strong> ⭐ {game.rating}/5</p>
        )}
        {game.metacritic && (
          <p><strong>Metacritic:</strong> {game.metacritic}/100</p>
        )}
        {game.playtime && (
          <p><strong>Durée:</strong> {game.playtime}h</p>
        )}
        {game.esrb_rating && (
          <p><strong>ESRB:</strong> {game.esrb_rating}</p>
        )}
      </div>
    </div>
  );
};

export default GameCard;