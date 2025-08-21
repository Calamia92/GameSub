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
    return 'http://localhost:8001/api';
  } catch (error) {
    console.warn('Impossible de détecter le port Django, utilisation du port par défaut 8001');
    return 'http://localhost:8001/api';
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
}

const apiService = new ApiService();
export default apiService;