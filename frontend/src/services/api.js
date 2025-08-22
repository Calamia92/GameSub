import axios from 'axios';
import { getAccessToken } from './supabase';

// Fonction pour détecter le port Django dynamiquement
function getDynamicApiUrl() {
  try {
    // Essaie de lire le fichier de port Django
    const djangoPortFile = '../django_port.txt';
    // En développement, on essaie plusieurs ports communs
    const commonPorts = [8000, 8001, 8002, 8003];

    // Pour l'instant, on utilise une logique simple
    // TODO: Implémenter une vraie détection de port via fetch
    return 'http://localhost:8000/api';
  } catch (error) {
    console.warn('Impossible de détecter le port Django, utilisation du port par défaut 8000');
    return 'http://localhost:8000/api';
  }
}

const API_BASE_URL = getDynamicApiUrl();

class ApiService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axios.interceptors.request.use(async (config) => {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor pour gérer les erreurs globalement
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide - Supabase gère automatiquement le refresh
          console.error('Token expired or invalid');
        }
        return Promise.reject(error);
      }
    );
  }

  // Les méthodes d'auth sont maintenant gérées par Supabase dans AuthContext
  // Ces méthodes sont conservées pour la compatibilité mais ne sont plus utilisées

  async searchGames(query, page = 1, filters = {}) {
    const params = { q: query, page, ...filters };
    const response = await this.axios.get('/search/', { params });
    return response.data;
  }

  async getGameSubstitutes(gameId) {
    const response = await this.axios.get(`/substitutes/${gameId}/`);
    return response.data;
  }

  async getUserSubstitutes() {
    const response = await this.axios.get('/my-substitutes/');
    return response.data;
  }

  async saveSubstitute(sourceGameId, substituteGameId, justification = '') {
    const response = await this.axios.post('/my-substitutes/', {
      source_game: sourceGameId,
      substitute_game: substituteGameId,
      justification,
    });
    return response.data;
  }

  async getSubstituteProfil(substituteGameId, justification = '') {
    const response = await this.axios.get('/substitutes_library_fav/', {
      substitute_game: substituteGameId,
      justification,
    });
    return response.data;
  }
  async saveSubstituteProfil(substituteGameId, justification = '') {
    const response = await this.axios.post('/substitutes_library_fav/', {
      substitute_game: substituteGameId,
      justification,
    });
    return response.data;
  }

  async getUserGames(status = null) {
    const params = status ? { status } : {};
    const response = await this.axios.get('/my-games/', { params });
    return response.data;
  }

  async saveUserGame(gameId, status, rating = null, notes = '') {
    const response = await this.axios.post('/my-games/', {
      game: gameId,
      status,
      rating,
      notes,
    });
    return response.data;
  }

  // Nouvelles méthodes pour l'historique de recherche
  async getSearchHistory() {
    const response = await this.axios.get('/my-search-history/');
    return response.data;
  }

  // Nouvelles méthodes pour la bibliothèque personnelle
  async getMyLibraries() {
    const response = await this.axios.get('/my-library/');
    return response.data;
  }

  async createLibrary(name, description = '', isPublic = false) {
    const response = await this.axios.post('/my-library/', {
      name,
      description,
      is_public: isPublic,
    });
    return response.data;
  }

  async getLibraryGames(libraryId) {
    const response = await this.axios.get(`/library/${libraryId}/games/`);
    return response.data;
  }

  async addGameFromAPI(externalId, addToLibrary = true) {
    const response = await this.axios.post('/add-game-from-api/', {
      external_id: externalId,
      add_to_library: addToLibrary,
    });
    return response.data;
  }

  // Méthodes pour les favoris (amélioration)  
  async getFavoriteGames() {
    return this.getUserGames('favorite');
  }

  async getMyLibraryGames() {
    return this.getUserGames('library');
  }

  // Nouvelles méthodes pour le profil utilisateur
  async getUserProfile() {
    const response = await this.axios.get('/profile/');
    return response.data;
  }

  async updateUserProfile(profileData) {
    const response = await this.axios.patch('/profile/', profileData);
    return response.data;
  }

  async getUserStats() {
    const response = await this.axios.get('/profile/stats/');
    return response.data;
  }

  // AI Recommendations
  async getUserRecommendations(limit = 10) {
    const response = await this.axios.get(`/recommendations/?limit=${limit}`);
    return response.data;
  }

  async getGameRecommendations(gameId, limit = 5) {
    const response = await this.axios.get(`/games/${gameId}/similar/?limit=${limit}`);
    return response.data;
  }

  async getTrendingGames(limit = 15) {
    const response = await this.axios.get(`/trending/?limit=${limit}`);
    return response.data;
  }

  // Semantic AI Search
  async semanticSearch(query, limit = 20, minSimilarity = 0.3) {
    const response = await this.axios.get('/search/semantic/', {
      params: { q: query, limit, min_similarity: minSimilarity }
    });
    return response.data;
  }

  async hybridSearch(query, limit = 20) {
    const response = await this.axios.get('/search/hybrid/', {
      params: { q: query, limit }
    });
    return response.data;
  }

  async getSearchSuggestions(query, limit = 5) {
    const response = await this.axios.get('/search/suggestions/', {
      params: { q: query, limit }
    });
    return response.data;
  }

  async compareSearchMethods(query, limit = 10) {
    const response = await this.axios.get('/search/compare/', {
      params: { q: query, limit }
    });
    return response.data;
  }

  // 🚀 NOUVEAU : Filtres IA Adaptatifs - Révolution UX
  
  async getAIFilterOptions() {
    const response = await this.axios.get('/ai-filters/options/');
    return response.data;
  }

  async aiAdaptiveSearch(query, aiFilters = {}, limit = 20) {
    const response = await this.axios.post('/search/ai-adaptive/', {
      query,
      ai_filters: aiFilters,
      limit,
      min_similarity: 0.3
    });
    return response.data;
  }

  async debugAIFilters(gameId, aiFilters = {}) {
    const response = await this.axios.post('/debug/ai-filters/', {
      game_id: gameId,
      ai_filters: aiFilters
    });
    return response.data;
  }

  // Méthodes aliasées pour une meilleure clarté
  async getUserLibrary() {
    return this.getMyLibraryGames();
  }

  // Méthodes génériques pour les requêtes HTTP
  async get(url, config = {}) {
    const response = await this.axios.get(url, config);
    return response;
  }

  async post(url, data = {}, config = {}) {
    const response = await this.axios.post(url, data, config);
    return response;
  }

  async put(url, data = {}, config = {}) {
    const response = await this.axios.put(url, data, config);
    return response;
  }

  async delete(url, config = {}) {
    const response = await this.axios.delete(url, config);
    return response;
  }
}

const apiService = new ApiService();
export default apiService;