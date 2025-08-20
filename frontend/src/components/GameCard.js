import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  StarIcon,
  ClockIcon,
  GamepadIcon,
  TrophyIcon,
  HeartIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const GameCard = ({ game, similarityScore = null }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    navigate(`/game/${game.external_id || game.id}`);
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) return alert('Connectez-vous pour ajouter aux favoris.');

    setLoading(true);
    try {
      await ApiService.saveUserGame(
        game.external_id || game.id,
        'favorite',
        Math.round(game.rating) || null,
        ''
      );
      setIsFavorite(true);
    } catch (err) {
      console.error(err);
      alert('Impossible d'ajouter aux favoris.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR') : 'Non spécifiée';

  const getGenreNames = (genres) => genres?.slice(0, 3).map(g => g.name || g) || [];

  const getPlatformNames = (platforms) =>
    platforms?.slice(0, 3).map(p => (p.platform?.name || p.name || p)) || [];

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4) return 'text-yellow-600';
    if (rating >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMetacriticColor = (score) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 50) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div
      className="card-hover cursor-pointer group animate-fade-in relative"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        {game.background_image ? (
          <img
            src={game.background_image}
            alt={game.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = 'data:image/svg+xml;base64,...'; }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <GamepadIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Similarity */}
        {similarityScore !== null && (
          <div className="absolute top-3 right-3">
            <div className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
              {Math.round(similarityScore * 100)}% similaire
            </div>
          </div>
        )}

        {/* Rating */}
        {game.rating && (
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
              <StarIcon className={`w-3 h-3 ${getRatingColor(game.rating)}`} />
              <span>{game.rating}</span>
            </div>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
          disabled={loading}
          title="Ajouter aux favoris"
        >
          <HeartIcon className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {game.name}
        </h3>

        {/* Genres */}
        {getGenreNames(game.genres).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getGenreNames(game.genres).map((genre, i) => (
              <span key={i} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Platforms */}
        {getPlatformNames(game.platforms).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getPlatformNames(game.platforms).map((platform, i) => (
              <span key={i} className="inline-block px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
                {platform}
              </span>
            ))}
          </div>
        )}

        {/* Dates & Playtime */}
        <div className="space-y-2 text-sm text-gray-600">
          {game.released && (
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span>{formatDate(game.released)}</span>
            </div>
          )}
          {game.playtime && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span>{game.playtime}h de jeu</span>
            </div>
          )}
        </div>

        {/* Metacritic & ESRB */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {game.metacritic && (
            <div className={`px-2 py-1 rounded-md text-xs font-semibold ${getMetacriticColor(game.metacritic)}`}>
              <div className="flex items-center space-x-1">
                <TrophyIcon className="w-3 h-3" />
                <span>{game.metacritic}</span>
              </div>
            </div>
          )}
          {game.esrb_rating && (
            <div className="px-2 py-1 bg-gray-800 text-white rounded-md text-xs font-semibold">
              {typeof game.esrb_rating === 'string' ? game.esrb_rating : game.esrb_rating.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
