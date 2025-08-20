import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  StarIcon, 
  ClockIcon, 
  GamepadIcon,
  TrophyIcon
} from 'lucide-react';

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
    if (!genres || genres.length === 0) return [];
    return genres.slice(0, 3).map(genre => genre.name || genre);
  };

  const getPlatformNames = (platforms) => {
    if (!platforms || platforms.length === 0) return [];
    return platforms.slice(0, 3).map(platform => {
      // Handle RAWG API structure: {platform: {id, name}} or direct {id, name}
      if (platform.platform && platform.platform.name) {
        return platform.platform.name;
      }
      return platform.name || platform;
    });
  };

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
      className="card-hover cursor-pointer group animate-fade-in"
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {game.background_image ? (
          <img 
            src={game.background_image} 
            alt={game.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBmaWxsPSIjOTQ5NEE0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTQ5NEE0IiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjE0Ij5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD4KPHN2Zz4K';
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <GamepadIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Similarity Score Badge */}
        {similarityScore !== null && (
          <div className="absolute top-3 right-3">
            <div className="bg-primary-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
              {Math.round(similarityScore * 100)}% similaire
            </div>
          </div>
        )}

        {/* Rating Badge */}
        {game.rating && (
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
              <StarIcon className={`w-3 h-3 ${getRatingColor(game.rating)}`} />
              <span>{game.rating}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {game.name}
          </h3>
        </div>

        {/* Genres */}
        {getGenreNames(game.genres).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getGenreNames(game.genres).map((genre, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Platforms */}
        {getPlatformNames(game.platforms).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getPlatformNames(game.platforms).map((platform, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium"
              >
                {platform}
              </span>
            ))}
          </div>
        )}

        {/* Game Info */}
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

        {/* Bottom Stats */}
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