import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseAuth } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Obtenir la session actuelle au chargement
    const getInitialSession = async () => {
      const { session, error } = await supabaseAuth.getSession();
      if (!error && session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabaseAuth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials) => {
    try {
      const { data, error } = await supabaseAuth.signIn(credentials.email || credentials.username, credentials.password);
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { data, error } = await supabaseAuth.signUp(
        userData.email, 
        userData.password, 
        {
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      );
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabaseAuth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};