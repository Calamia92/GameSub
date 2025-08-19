class TokenStorage {
  constructor() {
    this.tokenKey = 'authToken';
    this.userKey = 'user';
  }

  setToken(token) {
    if (this.isSecureContext()) {
      // En production, utiliser des cookies httpOnly serait mieux
      sessionStorage.setItem(this.tokenKey, token);
    } else {
      // En développement, localStorage est acceptable
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken() {
    if (this.isSecureContext()) {
      return sessionStorage.getItem(this.tokenKey);
    } else {
      return localStorage.getItem(this.tokenKey);
    }
  }

  setUser(user) {
    const storage = this.isSecureContext() ? sessionStorage : localStorage;
    storage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser() {
    const storage = this.isSecureContext() ? sessionStorage : localStorage;
    const user = storage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  clear() {
    const storage = this.isSecureContext() ? sessionStorage : localStorage;
    storage.removeItem(this.tokenKey);
    storage.removeItem(this.userKey);
  }

  isSecureContext() {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }
}

export default new TokenStorage();