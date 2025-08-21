import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

const AIFilters = ({ filters, onFiltersChange, onClear, isVisible, onToggle }) => {
  const [filterOptions, setFilterOptions] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    ambiance: true,
    engagement: false,
    session: false,
    social: false,
    difficulty: false
  });

  // Charger les options de filtres depuis l'API
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await fetch('/api/ai-filters/options/');
        const data = await response.json();
        setFilterOptions(data.filters || {});
      } catch (error) {
        console.error('Erreur chargement options filtres IA:', error);
        // Fallback vers options statiques
        setFilterOptions(getStaticFilterOptions());
      } finally {
        setLoadingOptions(false);
      }
    };

    loadFilterOptions();
  }, []);

  const getStaticFilterOptions = () => ({
    ambiance: [
      { id: 'relaxing', label: '😌 Relaxant', description: 'Pour se détendre et décompresser' },
      { id: 'intense', label: '⚡ Intense', description: 'Action et adrénaline garanties' },
      { id: 'mysterious', label: '🔮 Mystérieux', description: 'Énigmes et investigations' },
      { id: 'epic', label: '🏰 Épique', description: 'Grandes aventures héroïques' },
      { id: 'funny', label: '😄 Drôle', description: 'Humour et bonne humeur' }
    ],
    engagement: [
      { id: 'casual', label: '🎈 Casual', description: 'Facile à prendre en main' },
      { id: 'story', label: '📖 Story-driven', description: 'Axé sur la narration' },
      { id: 'hardcore', label: '🎯 Hardcore', description: 'Pour joueurs expérimentés' }
    ],
    session: [
      { id: 'short_session', label: '⏱️ Session courte', description: '15-60 minutes' },
      { id: 'medium_session', label: '🕐 Séance moyenne', description: '1-3 heures' },
      { id: 'long_session', label: '📅 Aventure longue', description: '10+ heures' }
    ],
    social: [
      { id: 'solo', label: '🧘 Solo', description: 'Expérience solo immersive' },
      { id: 'coop', label: '🤝 Coopératif', description: 'Jouer entre amis' },
      { id: 'competitive', label: '🏆 Compétitif', description: 'PvP et classements' }
    ],
    difficulty: [
      { id: 'accessible', label: '🟢 Accessible', description: 'Pour tous niveaux' },
      { id: 'challenging', label: '🟡 Challengeant', description: 'Demande de la maîtrise' },
      { id: 'punishing', label: '🔴 Punissant', description: 'Extremely difficult' }
    ]
  });

  const sectionTitles = {
    ambiance: '🎭 Quelle ambiance ?',
    engagement: '⚡ Type d\'expérience',
    session: '⏰ Durée de jeu',
    social: '👥 Aspect social',
    difficulty: '🎯 Difficulté'
  };

  const sectionDescriptions = {
    ambiance: 'Comment voulez-vous vous sentir en jouant ?',
    engagement: 'Quel type d\'engagement recherchez-vous ?',
    session: 'Combien de temps voulez-vous jouer ?',
    social: 'Voulez-vous jouer seul ou avec d\'autres ?',
    difficulty: 'Quel niveau de défi souhaitez-vous ?'
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (category, value) => {
    const newFilters = { ...filters };
    
    // Si c'est déjà sélectionné, on désélectionne
    if (newFilters[category] === value) {
      delete newFilters[category];
    } else {
      newFilters[category] = value;
    }
    
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).length;
  };

  const hasActiveFilters = () => {
    return getActiveFiltersCount() > 0;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 space-y-6 shadow-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-500 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-900">
              🧠 Filtres IA Adaptatifs
            </h3>
            <p className="text-sm text-purple-600">
              Filtres naturels basés sur vos intentions
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''}
            </div>
          )}
          
          {hasActiveFilters() && (
            <button
              onClick={onClear}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
              title="Effacer tous les filtres"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
          
          <button
            onClick={onToggle}
            className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
            title="Fermer les filtres"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loadingOptions && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-purple-600">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
            <span>Chargement des filtres IA...</span>
          </div>
        </div>
      )}

      {/* Filter sections */}
      {!loadingOptions && (
        <div className="space-y-4">
          {Object.entries(filterOptions).map(([category, options]) => (
            <div key={category} className="bg-white rounded-lg border border-purple-100 shadow-sm overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(category)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {sectionTitles[category]}
                    </h4>
                    {filters[category] && (
                      <div className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                        Actif
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {sectionDescriptions[category]}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {filters[category] && (
                    <span className="text-sm text-purple-600 font-medium">
                      {options.find(opt => opt.id === filters[category])?.label}
                    </span>
                  )}
                  {expandedSections[category] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Section content */}
              {expandedSections[category] && (
                <div className="p-4 border-t border-purple-100 bg-purple-25">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleFilterChange(category, option.id)}
                        className={`
                          group relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                          ${filters[category] === option.id
                            ? 'border-purple-500 bg-purple-100 shadow-md transform scale-105'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Emoji/Icon */}
                          <div className={`
                            text-2xl transition-transform duration-200
                            ${filters[category] === option.id ? 'scale-110' : 'group-hover:scale-105'}
                          `}>
                            {option.label.split(' ')[0]} {/* Extract emoji */}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className={`
                              font-medium text-sm
                              ${filters[category] === option.id ? 'text-purple-900' : 'text-gray-900'}
                            `}>
                              {option.label.split(' ').slice(1).join(' ')} {/* Label without emoji */}
                            </div>
                            <p className={`
                              text-xs mt-1 leading-tight
                              ${filters[category] === option.id ? 'text-purple-700' : 'text-gray-600'}
                            `}>
                              {option.description}
                            </p>
                          </div>
                        </div>

                        {/* Selection indicator */}
                        {filters[category] === option.id && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-purple-500 rounded-full p-1">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">
              💡 Comment ça marche ?
            </h5>
            <p className="text-sm text-blue-700 leading-relaxed">
              Ces filtres utilisent l'IA pour comprendre vos intentions plutôt que de simples catégories techniques. 
              Sélectionnez ce qui correspond à votre humeur et laissez l'IA trouver les jeux parfaits pour vous !
            </p>
          </div>
        </div>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters() && (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 mb-2 flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Filtres actifs</span>
          </h5>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([category, value]) => {
              const option = filterOptions[category]?.find(opt => opt.id === value);
              if (!option) return null;
              
              return (
                <div
                  key={`${category}-${value}`}
                  className="flex items-center space-x-2 bg-white border border-purple-300 rounded-full px-3 py-1.5 text-sm"
                >
                  <span>{option.label}</span>
                  <button
                    onClick={() => handleFilterChange(category, value)}
                    className="text-purple-500 hover:text-purple-700 transition-colors"
                    title="Supprimer ce filtre"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFilters;