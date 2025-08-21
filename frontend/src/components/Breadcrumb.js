import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(segment => segment !== '');
    
    const breadcrumbMap = {
      '': { label: 'Recherche', icon: Home },
      'my-substitutes': { label: 'Mes Substituts' },
      'my-library': { label: 'Ma Bibliothèque' },
      'search-history': { label: 'Historique des Recherches' },
      'login': { label: 'Connexion' },
      'register': { label: 'Inscription' },
      'game': { label: 'Détails du Jeu' }
    };

    let items = [{ label: 'Recherche', path: '/', icon: Home }];
    
    if (segments.length > 0) {
      segments.forEach((segment, index) => {
        const currentPath = '/' + segments.slice(0, index + 1).join('/');
        const breadcrumbInfo = breadcrumbMap[segment];
        
        if (breadcrumbInfo) {
          items.push({
            label: breadcrumbInfo.label,
            path: currentPath,
            icon: breadcrumbInfo.icon
          });
        }
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Don't show breadcrumb on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/60 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 py-3">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const Icon = item.icon;
            
            return (
              <div key={item.path} className="flex items-center space-x-2">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                
                {isLast ? (
                  <div className="flex items-center space-x-2">
                    {Icon && <Icon className="w-4 h-4 text-primary-600" />}
                    <span className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(item.path)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 rounded-lg px-2 py-1 hover:bg-primary-50"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Breadcrumb;