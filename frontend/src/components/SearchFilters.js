import React from 'react';
import { X } from 'lucide-react';

const SearchFilters = ({ filters, onChange, onClear }) => {
  // Genres populaires
  const genres = [
    { id: '', name: 'Tous les genres' },
    { id: 4, name: 'Action' },
    { id: 5, name: 'RPG' },
    { id: 3, name: 'Aventure' },
    { id: 10, name: 'Stratégie' },
    { id: 2, name: 'Shooter' },
    { id: 14, name: 'Simulation' },
    { id: 51, name: 'Indé' },
    { id: 7, name: 'Puzzle' },
    { id: 1, name: 'Course' },
    { id: 15, name: 'Sport' },
    { id: 16, name: 'Horreur' }
  ];

  // Plateformes principales
  const platforms = [
    { id: '', name: 'Toutes les plateformes' },
    { id: 4, name: 'PC' },
    { id: 187, name: 'PlayStation 5' },
    { id: 18, name: 'PlayStation 4' },
    { id: 186, name: 'Xbox Series S/X' },
    { id: 1, name: 'Xbox One' },
    { id: 7, name: 'Nintendo Switch' },
    { id: 3, name: 'iOS' },
    { id: 21, name: 'Android' }
  ];

  // Années de sortie
  const years = [
    { value: '', label: 'Toutes les années' },
    { value: '2024-01-01,2024-12-31', label: '2024' },
    { value: '2023-01-01,2023-12-31', label: '2023' },
    { value: '2022-01-01,2022-12-31', label: '2022' },
    { value: '2021-01-01,2021-12-31', label: '2021' },
    { value: '2020-01-01,2020-12-31', label: '2020' },
    { value: '2015-01-01,2019-12-31', label: '2015-2019' },
    { value: '2010-01-01,2014-12-31', label: '2010-2014' },
    { value: '2000-01-01,2009-12-31', label: '2000s' },
    { value: '1990-01-01,1999-12-31', label: '1990s' }
  ];

  // Notes minimales
  const ratings = [
    { value: '', label: 'Toutes les notes' },
    { value: '4.5', label: '4.5+ ⭐⭐⭐⭐⭐' },
    { value: '4.0', label: '4.0+ ⭐⭐⭐⭐' },
    { value: '3.5', label: '3.5+ ⭐⭐⭐' },
    { value: '3.0', label: '3.0+ ⭐⭐' }
  ];

  // Options de tri
  const sortOptions = [
    { value: '', label: 'Pertinence' },
    { value: '-rating', label: 'Mieux notés' },
    { value: '-released', label: 'Plus récents' },
    { value: '-metacritic', label: 'Metacritic' },
    { value: 'name', label: 'Nom A-Z' },
    { value: '-name', label: 'Nom Z-A' }
  ];

  const handleFilterChange = (key, value) => {
    onChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== undefined);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Genre */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Genre :</label>
          <select
            value={filters.genres || ''}
            onChange={(e) => handleFilterChange('genres', e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[120px]"
          >
            {genres.map(genre => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>

        {/* Plateforme */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Plateforme :</label>
          <select
            value={filters.platforms || ''}
            onChange={(e) => handleFilterChange('platforms', e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[140px]"
          >
            {platforms.map(platform => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>

        {/* Année */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Année :</label>
          <select
            value={filters.dates || ''}
            onChange={(e) => handleFilterChange('dates', e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[110px]"
          >
            {years.map(year => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* Note minimale */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Note min :</label>
          <select
            value={filters.rating || ''}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[140px]"
          >
            {ratings.map(rating => (
              <option key={rating.value} value={rating.value}>
                {rating.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tri */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Trier par :</label>
          <select
            value={filters.ordering || ''}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[120px]"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton Effacer */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors ml-auto"
          >
            <X className="w-4 h-4" />
            <span>Effacer</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;