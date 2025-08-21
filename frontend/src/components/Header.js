import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Gamepad2, 
  Menu, 
  X,
  LogOut,
  Library,
  History,
  Star,
  UserCircle
} from 'lucide-react';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: '/', label: 'Recherche', icon: Search },
    ...(isAuthenticated ? [
      { path: '/my-substitutes', label: 'Mes Substituts', icon: Star },
      { path: '/my-library', label: 'Ma Bibliothèque', icon: Library },
      { path: '/search-history', label: 'Historique', icon: History },
    ] : [])
  ];

  return (
    <header className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 shadow-xl sticky top-0 z-50 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavigation('/')}
          >
            <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl group-hover:bg-white/25 group-hover:scale-105 transition-all duration-300 shadow-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">GameSub</h1>
              <p className="text-primary-100/80 text-xs hidden sm:block font-medium">
                Trouvez des alternatives à vos jeux favoris
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    relative flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium
                    ${isActive 
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                    group
                  `}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="text-sm">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
            {/* User Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/20">
                    <UserCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-white text-sm font-semibold block">
                      {user?.email?.split('@')[0] || 'Utilisateur'}
                    </span>
                    <span className="text-white/70 text-xs">
                      Connecté
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-white/80 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 group border border-transparent hover:border-red-400/30"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  <span className="hidden lg:inline text-sm font-medium">Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-6">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium"
                >
                  Connexion
                </button>
                <button
                  onClick={() => handleNavigation('/register')}
                  className="px-4 py-2.5 bg-white/90 text-primary-700 hover:bg-white hover:scale-105 rounded-xl font-semibold transition-all duration-300 shadow-lg backdrop-blur-sm"
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
              className="p-2.5 text-white hover:bg-white/15 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 backdrop-blur-sm animate-fade-in">
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      flex items-center space-x-3 w-full px-4 py-3 transition-all duration-300 text-left rounded-xl font-medium
                      ${isActive 
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border-l-4 border-white' 
                        : 'text-white/80 hover:text-white hover:bg-white/10 border-l-4 border-transparent'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                );
              })}

              {/* Mobile User Section */}
              {isAuthenticated ? (
                <div className="pt-4 border-t border-white/20 mt-4">
                  <div className="flex items-center space-x-3 px-4 py-3 mb-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="text-white font-semibold block text-sm">
                        {user?.email?.split('@')[0] || 'Utilisateur'}
                      </span>
                      <span className="text-white/70 text-xs">Connecté</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-white/80 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 text-left font-medium border border-transparent hover:border-red-400/30"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-4 border-t border-white/20">
                  <button
                    onClick={() => handleNavigation('/login')}
                    className="w-full px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 text-left font-medium"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => handleNavigation('/register')}
                    className="w-full px-4 py-3 bg-white/90 text-primary-700 hover:bg-white rounded-xl font-semibold transition-all duration-300 text-left shadow-lg"
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