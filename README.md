# GameSub 🎮

Une application web moderne pour découvrir des alternatives à vos jeux favoris grâce à l'intelligence artificielle.

## 🚀 Fonctionnalités

### 🔍 Recherche & Découverte
- **Recherche classique** : Accès libre à 20k+ jeux via l'API RAWG
- **Recherche IA sémantique** : Compréhension intelligente des requêtes (utilisateurs connectés)
- **Filtres adaptatifs IA** : Filtres intelligents qui s'adaptent au contexte de recherche

### 🤖 Intelligence Artificielle (Utilisateurs connectés)
- **Quiz de préférences** : Découvrez vos goûts gaming en 5 questions avec l'IA
- **ChatBot spécialisé** : Assistant IA expert en jeux vidéo pour conseils et recommandations
- **Suggestions personnalisées** : Recommandations basées sur vos préférences et comportement

### 👤 Fonctionnalités Personnelles (Authentification requise)
- **Ma Bibliothèque** : Sauvegardez et organisez vos jeux favoris
- **Mes Substituts** : Gardez une trace de vos alternatives de jeux
- **Historique de recherche** : Retrouvez facilement vos recherches précédentes
- **Profil utilisateur** : Gestion de compte et statistiques personnelles

### 🎨 Interface & Design
- **Design moderne** : Interface responsive avec Tailwind CSS et animations
- **Authentification Supabase** : Système d'auth moderne avec JWT
- **Expérience progressive** : Fonctionnalités de base gratuites, avancées pour les membres

## 🛠 Stack Technique

### Backend
- **Django 5.2** - Framework web Python
- **Django REST Framework** - API REST
- **Supabase PostgreSQL** - Base de données cloud
- **JWT Authentication** - Authentification sécurisée avec vérification de signature
- **Redis Cloud** - Cache haute performance (30MB optimisé)
- **RAWG API** - Source des données de jeux (20k+ jeux)

### IA & Machine Learning
- **Hugging Face API** - Modèles IA pour suggestions et chat (DeepSeek-V3.1)
- **OpenAI Client** - Interface compatible pour interactions IA
- **Embeddings sémantiques** - Recherche intelligente basée sur la compréhension du sens
- **Sentence Transformers** - Traitement du langage naturel

### Frontend  
- **React 18** - Interface utilisateur moderne
- **Tailwind CSS** - Framework CSS utilitaire
- **Lucide React** - Icônes modernes
- **React Router** - Navigation SPA avec routes protégées
- **Axios** - Client HTTP avec intercepteurs

## 📋 Prérequis

1. **Python 3.8+** installé
2. **Node.js 16+** et npm installés
3. **Compte Supabase** (gratuit)
4. **Compte Redis Cloud** (gratuit - 30MB)
5. **Clé API RAWG** (gratuite sur https://rawg.io/apidocs)
6. **Token Hugging Face** (gratuit sur https://huggingface.co/settings/tokens)

## ⚡ Démarrage Rapide

GameSub propose **3 méthodes** pour lancer les serveurs :

### 🖱️ Méthode 1 : Script Windows (Recommandée)
```bash
start.bat
```
Script Batch qui lance automatiquement Django + React avec gestion des ports dynamiques.

### 🐍 Méthode 2 : Script Python  
```bash
python start_servers.py
```
Script Python cross-platform avec gestion avancée des processus.

### ⚙️ Méthode 3 : Lancement Manuel
```bash
# Terminal 1 - Django
python start_django.py

# Terminal 2 - React  
cd frontend
node start_frontend.js
```

---

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

# Redis Cache (production)
REDIS_URL=redis://username:password@your-redis-host:port

# RAWG API (obligatoire)
RAWG_API_KEY=votre_clé_rawg_ici

# Hugging Face IA (obligatoire pour fonctionnalités IA)
HUGGINGFACE_API_TOKEN=votre_token_huggingface_ici
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

### 🔓 Utilisateurs Visiteurs (Sans connexion)
1. **Recherche classique** : Parcourez 20k+ jeux via RAWG API
2. **Détails des jeux** : Consultez les informations complètes des jeux
3. **Navigation libre** : Interface responsive et intuitive

### 🔐 Utilisateurs Connectés (Fonctionnalités complètes)
1. **Recherche IA sémantique** : "jeux comme Zelda" avec compréhension contextuelle
2. **Quiz de préférences** : Découvrez vos goûts en 5 questions IA (Calcule tes goûts)
3. **ChatBot IA** : Assistant personnel expert en gaming
4. **Ma Bibliothèque** : Sauvegardez et organisez vos jeux favoris
5. **Mes Substituts** : Gardez vos alternatives de jeux
6. **Historique** : Retrouvez facilement vos recherches

## ✅ Fonctionnalités Implémentées

### 🎮 Core Features
🔍 **Recherche RAWG** - API avec 20k+ jeux réels  
🔐 **Auth Supabase** - JWT sécurisé avec vérification de signature  
🎨 **Design moderne** - Tailwind CSS, animations fluides  
📱 **Responsive** - Mobile-first design  
🚀 **Performance** - Cache Redis, optimisations avancées  

### 🤖 Intelligence Artificielle
🧠 **Quiz IA** - Analyse des préférences gaming en 5 questions  
💬 **ChatBot spécialisé** - Assistant IA expert en jeux vidéo  
🔍 **Recherche sémantique** - Compréhension contextuelle des requêtes  
🎯 **Suggestions personnalisées** - Recommandations enrichies RAWG + IA  

### 🛡️ Sécurité & Accès
🔒 **Routes protégées** - Fonctionnalités IA réservées aux membres  
🚫 **Restrictions d'accès** - Expérience progressive selon authentification  
✅ **API sécurisées** - Endpoints protégés côté backend  
⚡ **Temps réel** - Recherche instantanée mise en cache  

## 📁 Architecture

```
GameSub/
├── GameSub/              # Configuration Django
│   ├── settings.py       # Configuration avec Supabase
│   ├── middleware.py     # JWT Auth middleware  
│   └── urls.py          # URLs principales
├── games/               # App Django principale
│   ├── models.py        # Modèles avec UUID (Supabase)
│   ├── views.py         # Vues API REST + IA endpoints
│   ├── services.py      # Service RAWG API
│   ├── services_ai_*.py # Services IA (embeddings, recherche, filtres)
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

### Jeux (Accès libre)
- `GET /api/search/?q=query&page=1` - Rechercher des jeux
- `GET /api/substitutes/{game_id}/` - Obtenir les substituts d'un jeu
- `GET /api/games/` - Liste des jeux locaux
- `GET /api/games/{id}/` - Détails d'un jeu

### Intelligence Artificielle (Auth Supabase requise)
- `GET /api/quiz/questions/` - Obtenir 5 questions du quiz IA
- `POST /api/quiz/submit/` - Soumettre réponses et obtenir suggestions enrichies RAWG
- `GET /api/chatbot/starters/` - Obtenir questions suggérées du ChatBot
- `POST /api/chatbot/` - Envoyer message au ChatBot IA

### Utilisateur (Auth Supabase requise)
- `GET /api/my-substitutes/` - Mes substituts sauvegardés
- `POST /api/my-substitutes/` - Sauvegarder un substitut
- `GET /api/my-games/` - Mes jeux
- `POST /api/my-games/` - Ajouter un jeu à ma collection

### Authentification (gérée par Supabase côté frontend)
- Headers: `Authorization: Bearer {jwt_token}`
- Middleware Django valide automatiquement les JWT Supabase
- **Restriction d'accès** : Endpoints IA protégés avec `IsAuthenticated`

## 🐛 Dépannage

### Erreur CORS
```bash
# Les scripts automatiques gèrent les ports dynamiquement :
# Django: http://localhost:8000-8001
# React: http://localhost:3000-3004
# Vérifiez les fichiers django_port.txt et frontend/react_port.txt
```

### Erreur API RAWG "401 Unauthorized"
```bash
# Vérifiez votre clé API RAWG dans .env
RAWG_API_KEY=votre_vraie_clé_ici  # Pas de JWT Supabase !
```

### Erreur Hugging Face IA "401 Unauthorized"
```bash
# Vérifiez votre token Hugging Face dans .env
HUGGINGFACE_API_TOKEN=hf_votre_token_ici
# Créez un token gratuit sur: https://huggingface.co/settings/tokens
# Sans ce token, les fonctionnalités IA (Quiz, ChatBot) ne fonctionnent pas
```

### Erreur Supabase connexion
```bash
# Vérifiez vos URLs et clés Supabase dans .env
# Testez la connexion dans l'interface Supabase
```

### Fonctionnalités IA non disponibles
```bash
# Vérifiez que vous êtes connecté en tant qu'utilisateur authentifié
# Les fonctionnalités IA sont réservées aux membres (Quiz, ChatBot, Recherche sémantique)
# Visiteurs: recherche classique uniquement
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
CORS_ALLOWED_ORIGINS=https://votre-domaine.com
REDIS_URL=redis://username:password@your-redis:port
# Gardez les mêmes clés Supabase et RAWG
```

### Commandes utiles
```bash
# Surveiller le cache Redis
python manage.py cache_monitor --stats

# Nettoyer le cache si nécessaire
python manage.py cache_monitor --clean

# Tester les endpoints IA (utilisateurs connectés uniquement)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8001/api/quiz/questions/
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8001/api/chatbot/starters/
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