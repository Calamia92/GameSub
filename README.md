# GameSub 🎮

Une application web moderne pour découvrir des alternatives à vos jeux favoris grâce à l'intelligence artificielle.

## 🚀 Fonctionnalités

- **Recherche intelligente** : Trouvez des jeux en temps réel via l'API RAWG
- **Suggestions IA** : Algorithme de recommandation basé sur les genres, tags et ratings
- **Authentification Supabase** : Système d'auth moderne avec JWT
- **Design moderne** : Interface responsive avec Tailwind CSS et animations
- **Base de données cloud** : PostgreSQL hébergé sur Supabase

## 🛠 Stack Technique

### Backend
- **Django 5.2** - Framework web Python
- **Django REST Framework** - API REST
- **Supabase PostgreSQL** - Base de données cloud
- **JWT Authentication** - Authentification moderne
- **RAWG API** - Source des données de jeux (20k+ jeux)

### Frontend  
- **React 18** - Interface utilisateur moderne
- **Tailwind CSS** - Framework CSS utilitaire
- **Lucide React** - Icônes modernes
- **React Router** - Navigation SPA
- **Axios** - Client HTTP avec intercepteurs

## 📋 Prérequis

1. **Python 3.8+** installé
2. **Node.js 16+** et npm installés
3. **Compte Supabase** (gratuit)
4. **Clé API RAWG** (gratuite sur https://rawg.io/apidocs)

## ⚡ Installation Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/votre-username/gamesub.git
cd gamesub
```

### 2. Configuration Backend (Django)

#### Installer les dépendances Python
```bash
pip install -r requirements.txt
```

#### Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet :
```env
# Django
DEBUG=True
SECRET_KEY=votre-clé-secrète-django
ALLOWED_HOSTS=localhost,127.0.0.1

# Supabase Database
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_supabase
DB_HOST=votre_host_supabase.supabase.co
DB_PORT=5432

# Supabase Auth
SUPABASE_URL=https://votre_projet.supabase.co
SUPABASE_ANON_KEY=votre_clé_anonyme_supabase

# RAWG API (obligatoire)
RAWG_API_KEY=votre_clé_rawg_ici
```

#### Appliquer les migrations
```bash
python manage.py migrate
```

#### Lancer le serveur Django
```bash
python manage.py runserver 8001
```
✅ Backend disponible sur http://localhost:8001

### 3. Configuration Frontend (React)

#### Installer les dépendances Node.js
```bash
cd frontend
npm install
```

#### Lancer l'application React
```bash
npm start
```
✅ Frontend disponible sur http://localhost:3003

## 🎯 Utilisation

1. **Recherche de jeux** : Page d'accueil avec recherche en temps réel
2. **Navigation** : Interface responsive avec menu mobile
3. **Authentification** : Inscription/connexion avec Supabase
4. **Découverte** : Parcourez des milliers de jeux avec filtres
5. **Sauvegarde** : Créez votre bibliothèque personnelle

## ✅ Fonctionnalités Implémentées

🎮 **Recherche RAWG** - API avec 20k+ jeux réels  
🔐 **Auth Supabase** - JWT moderne, sessions persistantes  
🎨 **Design moderne** - Tailwind CSS, animations fluides  
📱 **Responsive** - Mobile-first design  
🚀 **Performance** - Lazy loading, optimisations  
🛡️ **Sécurisé** - CORS configuré, validation des données  
⚡ **Temps réel** - Recherche instantanée  

## 📁 Architecture

```
GameSub/
├── GameSub/              # Configuration Django
│   ├── settings.py       # Configuration avec Supabase
│   ├── middleware.py     # JWT Auth middleware  
│   └── urls.py          # URLs principales
├── games/               # App Django principale
│   ├── models.py        # Modèles avec UUID (Supabase)
│   ├── views.py         # Vues API REST
│   ├── services.py      # Service RAWG API
│   └── serializers.py   # Sérialiseurs DRF
├── frontend/            # Application React
│   ├── src/
│   │   ├── components/  # Composants React modernes
│   │   ├── pages/       # Pages (Home, Login, Register)
│   │   ├── services/    # Services (API, Supabase)
│   │   ├── contexts/    # Contexte Auth
│   │   └── index.css    # Styles Tailwind
│   ├── package.json     # Dépendances React
│   └── tailwind.config.js # Config Tailwind
├── requirements.txt     # Dépendances Python
└── .env                # Variables d'environnement
```

## 🔌 Endpoints API

### Jeux
- `GET /api/search/?q=query&page=1` - Rechercher des jeux
- `GET /api/substitutes/{game_id}/` - Obtenir les substituts d'un jeu
- `GET /api/games/` - Liste des jeux locaux
- `GET /api/games/{id}/` - Détails d'un jeu

### Utilisateur (Auth Supabase requise)
- `GET /api/my-substitutes/` - Mes substituts sauvegardés
- `POST /api/my-substitutes/` - Sauvegarder un substitut
- `GET /api/my-games/` - Mes jeux
- `POST /api/my-games/` - Ajouter un jeu à ma collection

### Authentification (gérée par Supabase côté frontend)
- Headers: `Authorization: Bearer {jwt_token}`
- Middleware Django valide automatiquement les JWT Supabase

## 🐛 Dépannage

### Erreur CORS
```bash
# Vérifiez que les serveurs tournent sur les bons ports :
# Django: http://localhost:8001
# React: http://localhost:3003
```

### Erreur API RAWG "401 Unauthorized"
```bash
# Vérifiez votre clé API RAWG dans .env
RAWG_API_KEY=votre_vraie_clé_ici  # Pas de JWT Supabase !
```

### Erreur Supabase connexion
```bash
# Vérifiez vos URLs et clés Supabase dans .env
# Testez la connexion dans l'interface Supabase
```

### Base de données
```sql
-- Supprimer les tables Django Auth (optionnel)
DROP TABLE IF EXISTS auth_user CASCADE;
DROP TABLE IF EXISTS authtoken_token CASCADE;
-- etc. (voir section nettoyage dans les issues)
```

## 🚀 Déploiement

### Prêt pour le déploiement sur :
- **Backend** : Railway, Heroku, DigitalOcean
- **Frontend** : Vercel, Netlify, Surge
- **Database** : Supabase (inclus)
- **Images** : Supabase Storage ou Cloudinary

### Variables d'environnement de production
```env
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com
# Gardez les mêmes clés Supabase et RAWG
```

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche : `git checkout -b feature/ma-fonctionnalité`
3. Commitez : `git commit -m 'Ajout de ma fonctionnalité'`
4. Push : `git push origin feature/ma-fonctionnalité`
5. Ouvrez une Pull Request

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

Créé avec ❤️ par OMRI Boubaker, PERSONNE Théo, KRAICHETTE Théo

---

**🎮 Découvrez votre prochain jeu favori avec GameSub !**