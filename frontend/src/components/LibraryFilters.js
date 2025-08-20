import React, { useState, useMemo } from 'react';
import { 
  FilterIcon, 
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  TagIcon,
  GamepadIcon,
  CalendarIcon,
  TrophyIcon
} from 'lucide-react';

const LibraryFilters = ({ games, filters, onFiltersChange, onClear }) => {
  const [expandedSections, setExpandedSections] = useState({
    genres: true,
    platforms: true,
    ratings: true,
    years: false,
    metacritic: false
  });

  // Extraire tous les genres uniques des jeux
  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    games.forEach(userGame => {
      const game = userGame.game;
      if (game.genres && Array.isArray(game.genres)) {
        game.genres.forEach(genre => {
          if (genre && (genre.name || typeof genre === 'string')) {
            genreSet.add(genre.name || genre);
          }
        });
      }
    });
    return Array.from(genreSet).sort();
  }, [games]);

  // Extraire toutes les plateformes uniques des jeux
  const availablePlatforms = useMemo(() => {
    const platformSet = new Set();
    games.forEach(userGame => {
      const game = userGame.game;
      if (game.platforms && Array.isArray(game.platforms)) {
        game.platforms.forEach(platform => {
          const name = platform.platform?.name || platform.name || platform;
          if (name && typeof name === 'string') {
            platformSet.add(name);
          }
        });
      }
    });
    return Array.from(platformSet).sort();
  }, [games]);

  // Extraire les années disponibles
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    games.forEach(userGame => {
      const game = userGame.game;
      if (game.released) {
        const year = new Date(game.released).getFullYear();
        if (!isNaN(year)) {
          yearSet.add(year);
        }
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [games]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (category, value, checked) => {
    const currentValues = filters[category] || [];
    let newValues;
    
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    onFiltersChange({
      ...filters,
      [category]: newValues
    });
  };

  const handleRatingChange = (rating) => {
    onFiltersChange({
      ...filters,
      minRating: filters.minRating === rating ? null : rating
    });
  };

  const handleMetacriticChange = (score) => {
    onFiltersChange({
      ...filters,
      minMetacritic: filters.minMetacritic === score ? null : score
    });
  };

  const hasActiveFilters = () => {
    return (filters.genres?.length > 0) ||
           (filters.platforms?.length > 0) ||
           (filters.years?.length > 0) ||
           filters.minRating ||
           filters.minMetacritic;
  };

  const FilterSection = ({ title, icon: Icon, section, children }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        {expandedSections[section] ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="mt-2 pl-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const CheckboxOption = ({ label, value, category, count }) => (
    <label className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
      <input
        type="checkbox"
        checked={filters[category]?.includes(value) || false}
        onChange={(e) => handleFilterChange(category, value, e.target.checked)}
        className="w-3 h-3 text-primary-600 rounded focus:ring-primary-500 focus:ring-1"
      />
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </label>
  );

  const RatingOption = ({ rating, label }) => (
    <button
      onClick={() => handleRatingChange(rating)}
      className={`w-full flex items-center space-x-2 p-2 rounded-md text-left transition-colors ${
        filters.minRating === rating
          ? 'bg-primary-50 text-primary-700 border border-primary-200'
          : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      <StarIcon className={`w-4 h-4 ${
        filters.minRating === rating ? 'text-primary-500' : 'text-gray-400'
      }`} />
      <span className="text-sm">{label}</span>
    </button>
  );

  // Compter les jeux par genre pour afficher les statistiques
  const genreCounts = useMemo(() => {
    const counts = {};
    availableGenres.forEach(genre => {
      counts[genre] = games.filter(userGame => 
        userGame.game.genres?.some(g => (g.name || g) === genre)
      ).length;
    });
    return counts;
  }, [games, availableGenres]);

  // Compter les jeux par plateforme
  const platformCounts = useMemo(() => {
    const counts = {};
    availablePlatforms.forEach(platform => {
      counts[platform] = games.filter(userGame => 
        userGame.game.platforms?.some(p => 
          (p.platform?.name || p.name || p) === platform
        )
      ).length;
    });
    return counts;
  }, [games, availablePlatforms]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FilterIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        </div>
        {hasActiveFilters() && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            <XIcon className="w-4 h-4" />
            <span>Effacer</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Genres */}
        <FilterSection title="Genres" icon={TagIcon} section="genres">
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableGenres.map(genre => (
              <CheckboxOption
                key={genre}
                label={genre}
                value={genre}
                category="genres"
                count={genreCounts[genre]}
              />
            ))}
          </div>
        </FilterSection>

        {/* Plateformes */}
        <FilterSection title="Plateformes" icon={GamepadIcon} section="platforms">
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availablePlatforms.map(platform => (
              <CheckboxOption
                key={platform}
                label={platform}
                value={platform}
                category="platforms"
                count={platformCounts[platform]}
              />
            ))}
          </div>
        </FilterSection>

        {/* Note minimale */}
        <FilterSection title="Note minimale" icon={StarIcon} section="ratings">
          <div className="space-y-1">
            <RatingOption rating={4.5} label="4.5+ ⭐⭐⭐⭐⭐" />
            <RatingOption rating={4.0} label="4.0+ ⭐⭐⭐⭐" />
            <RatingOption rating={3.5} label="3.5+ ⭐⭐⭐" />
            <RatingOption rating={3.0} label="3.0+ ⭐⭐" />
            <RatingOption rating={2.0} label="2.0+ ⭐" />
          </div>
        </FilterSection>

        {/* Années */}
        <FilterSection title="Année de sortie" icon={CalendarIcon} section="years">
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableYears.map(year => {
              const count = games.filter(userGame => 
                userGame.game.released && new Date(userGame.game.released).getFullYear() === year
              ).length;
              return (
                <CheckboxOption
                  key={year}
                  label={year.toString()}
                  value={year}
                  category="years"
                  count={count}
                />
              );
            })}
          </div>
        </FilterSection>

        {/* Score Metacritic */}
        <FilterSection title="Score Metacritic" icon={TrophyIcon} section="metacritic">
          <div className="space-y-1">
            {[90, 80, 70, 60, 50].map(score => (
              <button
                key={score}
                onClick={() => handleMetacriticChange(score)}
                className={`w-full flex items-center space-x-2 p-2 rounded-md text-left transition-colors ${
                  filters.minMetacritic === score
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <TrophyIcon className={`w-4 h-4 ${
                  filters.minMetacritic === score ? 'text-primary-500' : 'text-gray-400'
                }`} />
                <span className="text-sm">{score}+ points</span>
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Résumé des filtres actifs */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Filtres actifs:</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {filters.genres?.length > 0 && (
              <div>Genres: {filters.genres.length} sélectionné(s)</div>
            )}
            {filters.platforms?.length > 0 && (
              <div>Plateformes: {filters.platforms.length} sélectionnée(s)</div>
            )}
            {filters.years?.length > 0 && (
              <div>Années: {filters.years.length} sélectionnée(s)</div>
            )}
            {filters.minRating && (
              <div>Note min: {filters.minRating}⭐</div>
            )}
            {filters.minMetacritic && (
              <div>Metacritic min: {filters.minMetacritic}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryFilters;