import axios from 'axios';
import { getAccessToken } from './supabase';

const API_BASE_URL = 'http://localhost:8001/api';

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
}

export default new ApiService();