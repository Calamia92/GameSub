import axios from 'axios';
import tokenStorage from './tokenStorage';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axios.interceptors.request.use((config) => {
      const token = tokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });

    // Interceptor pour gérer les erreurs globalement
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          tokenStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async register(userData) {
    const response = await this.axios.post('/auth/register/', userData);
    if (response.data.token) {
      tokenStorage.setToken(response.data.token);
      tokenStorage.setUser(response.data.user);
    }
    return response.data;
  }

  async login(credentials) {
    const response = await this.axios.post('/auth/login/', credentials);
    if (response.data.token) {
      tokenStorage.setToken(response.data.token);
      tokenStorage.setUser(response.data.user);
    }
    return response.data;
  }

  async logout() {
    try {
      await this.axios.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.clear();
    }
  }

  getCurrentUser() {
    return tokenStorage.getUser();
  }

  isAuthenticated() {
    return !!tokenStorage.getToken();
  }

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