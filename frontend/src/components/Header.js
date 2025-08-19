import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          GameSub
        </h1>
        <p>Trouvez des alternatives à vos jeux favoris</p>
        <nav className="nav">
          <button onClick={() => navigate('/')}>
            Recherche
          </button>
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/my-substitutes')}>
                Mes Substituts
              </button>
              <span style={{ color: 'white', padding: '10px' }}>
                Bonjour, {user?.username}
              </span>
              <button onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')}>
                Connexion
              </button>
              <button onClick={() => navigate('/register')}>
                Inscription
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;