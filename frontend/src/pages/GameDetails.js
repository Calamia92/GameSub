import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';
import { 
  CalendarIcon, 
  StarIcon, 
  ClockIcon, 
  GamepadIcon, 
  TrophyIcon, 
  BookmarkIcon,
  ExternalLinkIcon,
  ArrowLeftIcon,
  TagIcon,
  UsersIcon
} from 'lucide-react';

const GameDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useSnackbar();
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
      showError('Vous devez être connecté pour sauvegarder des substituts');
      return;
    }

    setSavingSubstitute(substitute.id);
    
    try {
      await ApiService.saveSubstitute(
        gameData.id,
        substitute.id,
        `Substitut suggéré avec ${Math.round(substitute.similarity_score * 100)}% de similarité`
      );
      showSuccess('Substitut sauvegardé avec succès!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        showError('Ce substitut est déjà dans votre bibliothèque');
      } else {
        showError('Erreur lors de la sauvegarde');
      }
      console.error('Save substitute error:', err);
    } finally {
      setSavingSubstitute(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Chargement des détails du jeu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-red-500 mb-2">
              <ExternalLinkIcon className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-yellow-500 mb-2">
              <GamepadIcon className="w-8 h-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Jeu introuvable</h3>
            <p className="text-yellow-700">Ce jeu n'existe pas ou n'est plus disponible.</p>
          </div>
        </div>
      </div>
    );
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
        className="inline-flex items-center px-3 py-2 mr-2 mb-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
      >
        <ExternalLinkIcon className="w-4 h-4 mr-1" />
        {store.name}
      </a>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          {/* Game Header */}
          <div className="relative">
            {gameData.background_image && (
              <div className="relative h-80 lg:h-96">
                <img 
                  src={gameData.background_image}
                  alt={gameData.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            )}
            
            {/* Game Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 text-shadow">{gameData.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {gameData.rating && (
                  <div className="flex items-center bg-black/30 rounded-full px-3 py-1">
                    <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-semibold">{gameData.rating}/5</span>
                  </div>
                )}
                {gameData.metacritic && (
                  <div className="flex items-center bg-black/30 rounded-full px-3 py-1">
                    <TrophyIcon className="w-4 h-4 text-green-400 mr-1" />
                    <span className="font-semibold">{gameData.metacritic}/100</span>
                  </div>
                )}
                {gameData.released && (
                  <div className="flex items-center bg-black/30 rounded-full px-3 py-1">
                    <CalendarIcon className="w-4 h-4 text-blue-400 mr-1" />
                    <span>{formatDate(gameData.released)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Game Details */}
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {gameData.description && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                      <BookmarkIcon className="w-5 h-5 mr-2 text-primary-600" />
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {gameData.description}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Side Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <TagIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Genres</p>
                        <p className="text-gray-900">{getGenreNames(gameData.genres)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <GamepadIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Plateformes</p>
                        <p className="text-gray-900">{getPlatformNames(gameData.platforms)}</p>
                      </div>
                    </div>
                    
                    {gameData.playtime && (
                      <div className="flex items-start">
                        <ClockIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Durée moyenne</p>
                          <p className="text-gray-900">{gameData.playtime}h</p>
                        </div>
                      </div>
                    )}
                    
                    {gameData.esrb_rating && (
                      <div className="flex items-start">
                        <UsersIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Classification ESRB</p>
                          <p className="text-gray-900">{gameData.esrb_rating}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Store Links */}
                {gameData.stores && gameData.stores.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ExternalLinkIcon className="w-5 h-5 mr-2" />
                      Disponible sur
                    </h3>
                    <div className="space-y-2">
                      {getStoreLinks(gameData.stores)}
                    </div>
                  </div>
                )}
                
                {/* Official Website */}
                {gameData.website && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Site officiel</h3>
                    <a 
                      href={gameData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                      Visiter le site
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Substituts suggérés */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <GamepadIcon className="w-6 h-6 mr-2 text-primary-600" />
                Jeux similaires recommandés
                <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                  {substitutes.length}
                </span>
              </h2>
            </div>
            
            {substitutes.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
                  <GamepadIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun substitut trouvé
                  </h3>
                  <p className="text-gray-500">
                    Nous n'avons pas trouvé de jeux similaires pour ce titre.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {substitutes.map((substitute) => (
                  <div key={substitute.id} className="relative group">
                    <GameCard 
                      game={substitute} 
                      similarityScore={substitute.similarity_score} 
                    />
                    {isAuthenticated && (
                      <button
                        onClick={() => saveSubstitute(substitute)}
                        disabled={savingSubstitute === substitute.id}
                        className="absolute top-3 right-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 opacity-0 group-hover:opacity-100 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingSubstitute === substitute.id ? (
                          <div className="loading-spinner w-3 h-3" />
                        ) : (
                          <>
                            <BookmarkIcon className="w-3 h-3" />
                            <span>Sauvegarder</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!isAuthenticated && substitutes.length > 0 && (
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="bg-yellow-100 rounded-full p-2">
                    <UsersIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-yellow-800 font-medium">
                    Connectez-vous pour sauvegarder vos substituts favoris!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;