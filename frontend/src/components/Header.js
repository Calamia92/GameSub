import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  SearchIcon, 
  GamepadIcon, 
  UserIcon, 
  MenuIcon, 
  XIcon,
  LogOutIcon,
  BookOpenIcon,
  ClockIcon
} from 'lucide-react';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
              <GamepadIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GameSub</h1>
              <p className="text-primary-100 text-xs hidden sm:block">
                Trouvez des alternatives à vos jeux favoris
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <SearchIcon className="w-4 h-4" />
              <span>Recherche</span>
            </button>

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavigation('/my-substitutes')}
                  className="flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Mes Substituts</span>
                </button>
                
                <button
                  onClick={() => handleNavigation('/my-library')}
                  className="flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <BookOpenIcon className="w-4 h-4" />
                  <span>Ma Bibliothèque</span>
                </button>
                
                <button
                  onClick={() => handleNavigation('/search-history')}
                  className="flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ClockIcon className="w-4 h-4" />
                  <span>Historique</span>
                </button>
                
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {user?.email?.split('@')[0] || 'Utilisateur'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-white/90 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    <span className="hidden lg:inline">Déconnexion</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Connexion
                </button>
                <button
                  onClick={() => handleNavigation('/register')}
                  className="px-4 py-2 bg-white text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
                >
                  Inscription
                </button>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 animate-fade-in">
            <nav className="space-y-2">
              <button
                onClick={() => handleNavigation('/')}
                className="flex items-center space-x-3 w-full px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <SearchIcon className="w-5 h-5" />
                <span>Recherche</span>
              </button>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavigation('/my-substitutes')}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Mes Substituts</span>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation('/my-library')}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                  >
                    <BookOpenIcon className="w-5 h-5" />
                    <span>Ma Bibliothèque</span>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation('/search-history')}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                  >
                    <ClockIcon className="w-5 h-5" />
                    <span>Historique</span>
                  </button>
                  
                  <div className="px-4 py-3 border-t border-white/20 mt-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium">
                        {user?.email?.split('@')[0] || 'Utilisateur'}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-white/90 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors text-left"
                    >
                      <LogOutIcon className="w-5 h-5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2 pt-4 border-t border-white/20">
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="w-full px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="w-full px-4 py-3 bg-white text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors text-left"
                  >
                    Inscription
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;