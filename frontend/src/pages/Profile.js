import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import GameCard from '../components/GameCard';
import ProfileRecommendationsButton from '../components/ProfileRecommendationsButton';
import {
  UserCircle,
  Edit3,
  Save,
  X,
  Star,
  Library,
  Calendar,
  Mail,
  TrophyIcon,
} from 'lucide-react';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    display_name: '',
    bio: '',
    favorite_genre: '',
    created_at: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [libraryGames, setLibraryGames] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({
    total_substitutes: 0,
    total_library: 0,
    total_searches: 0
  });

  // Redirection si non connecté
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Chargement des données du profil
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const profileResponse = await ApiService.getUserProfile();
        setProfileData({
          display_name: profileResponse.display_name || user?.email?.split('@')[0] || 'Utilisateur',
          bio: profileResponse.bio || '',
          favorite_genre: profileResponse.favorite_genre || '',
          created_at: profileResponse.created_at || user?.created_at
        });

        const statsResponse = await ApiService.getUserStats();
        setStats(statsResponse);

        // Favoris et bibliothèque : structure userGame.game
        const favoritesResponse = await ApiService.getFavoriteGames();
        setFavoriteGames(favoritesResponse.results || favoritesResponse || []);

        const libraryResponse = await ApiService.getMyLibraryGames();
        setLibraryGames(libraryResponse.results || libraryResponse || []);

        // Nouvelles recommandations IA
        try {
          const recommendationsResponse = await ApiService.getUserRecommendations(8);
          // Les recommandations IA retournent directement les jeux, pas userGame.game
          const recommendations = recommendationsResponse.recommendations || [];
          setRecommendations(recommendations);
        } catch (error) {
          console.error('Erreur lors du chargement des recommandations:', error);
          // En cas d'erreur, charger les jeux tendance comme fallback
          try {
            const trendingResponse = await ApiService.getTrendingGames(8);
            const trending = trendingResponse.trending || [];
            setRecommendations(trending);
          } catch (trendingError) {
            console.error('Erreur lors du chargement des tendances:', error);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user, showError]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await ApiService.updateUserProfile(profileData);
      showSuccess('Profil mis à jour avec succès!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showError('Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    window.location.reload();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête du profil */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                <UserCircle className="w-16 h-16 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profileData.display_name}
                    </h1>
                    <div className="flex items-center space-x-4 text-primary-100">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{user?.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Membre depuis {formatDate(profileData.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 border border-white/30"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_substitutes}</div>
              <div className="text-sm text-gray-500">Substituts sauvegardés</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <Library className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_library}</div>
              <div className="text-sm text-gray-500">Jeux en bibliothèque</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_searches}</div>
              <div className="text-sm text-gray-500">Recherches effectuées</div>
            </div>
          </div>
        </div>

        {/* Section Bio / Edition */}
        {isEditing && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pseudo</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={profileData.display_name}
                  onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Genre préféré</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={profileData.favorite_genre}
                  onChange={(e) => setProfileData({ ...profileData, favorite_genre: e.target.value })}
                />
              </div>
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Favoris */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Star className="w-5 h-5 mr-2 text-primary-600" />
              Mes Substituts Favoris
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {favoriteGames.length > 0 ? (
              favoriteGames.map((userGame) => (
                <GameCard key={userGame.id} game={userGame.game} />
              ))
            ) : (
              <p className="text-gray-500 col-span-full">Aucun jeu favori pour le moment.</p>
            )}
          </div>
        </div>

        {/* Bibliothèque */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Library className="w-5 h-5 mr-2 text-primary-600" />
              Ma Bibliothèque
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {libraryGames.length > 0 ? (
              libraryGames.map((userGame) => (
                <GameCard key={userGame.id} game={userGame.game} />
              ))
            ) : (
              <p className="text-gray-500 col-span-full">Votre bibliothèque est vide.</p>
            )}
          </div>
        </div>

        {/* Recommandations */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Star className="w-5 h-5 mr-2 text-primary-600" />
              Recommandations pour vous
            </h2>
            <ProfileRecommendationsButton />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <div key={recommendation.id} className="relative">
                  <GameCard game={recommendation} />
                  {/* Badge de score de similarité */}
                  <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                    {Math.round(recommendation.similarity_score * 100)}%
                  </div>
                  {recommendation.is_trending && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      🔥 Trending
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full">Aucune recommandation pour le moment. Ajoutez des jeux à vos favoris pour recevoir des recommandations personnalisées !</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;