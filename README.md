# GameSub 🎮

Une application web moderne pour découvrir des alternatives à vos jeux favoris.

## 🚀 Fonctionnalités

- **Recherche intelligente** : Trouvez des jeux par nom, genre, plateforme ou année
- **Suggestions personnalisées** : Algorithme de recommandation basé sur les genres, tags et ratings
- **Authentification sécurisée** : Créez votre compte et gérez votre profil
- **Bibliothèque personnelle** : Sauvegardez vos découvertes de substituts
- **Interface moderne** : Design responsive avec React

## 🛠 Technologies

### Backend
- **Django 5.2** - Framework web Python
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de données
- **RAWG API** - Source des données de jeux

### Frontend  
- **React 18** - Interface utilisateur
- **React Router** - Navigation
- **Axios** - Client HTTP

## 📋 Prérequis

1. **Python 3.8+** installé
2. **Node.js 14+** et npm installés
3. **PostgreSQL** ou compte **Supabase**
4. **Clé API RAWG** (gratuite sur https://rawg.io/apidocs)

## Installation Backend (Django)

### 1. Installer les dépendances Python
```bash
cd GameSub
pip install -r requirements.txt
```

### 2. Configurer la base de données
Editez le fichier `.env` avec vos informations :
```env
# Base de données PostgreSQL/Supabase
DB_NAME=gamesub
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432

# Clé API RAWG (obligatoire)
RAWG_API_KEY=your_rawg_api_key_here
```

### 3. Appliquer les migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Créer un superutilisateur (optionnel)
```bash
python manage.py createsuperuser
```

### 5. Lancer le serveur Django
```bash
python manage.py runserver
```
Le backend sera disponible sur http://localhost:8000

## Installation Frontend (React)

### 1. Installer les dépendances Node.js
```bash
cd frontend
npm install
```

### 2. Lancer l'application React
```bash
npm start
```
Le frontend sera disponible sur http://localhost:3000

## Utilisation

1. **Recherche de jeux** : Allez sur la page d'accueil et recherchez un jeu par nom
2. **Voir les détails** : Cliquez sur un jeu pour voir ses détails et substituts suggérés
3. **Créer un compte** : Inscrivez-vous pour sauvegarder vos substituts favoris
4. **Mes substituts** : Une fois connecté, accédez à votre bibliothèque de substituts

## Fonctionnalités

✅ **Recherche de jeux** via l'API RAWG  
✅ **Suggestions de substituts** basées sur les genres, tags et ratings  
✅ **Authentification utilisateur** (inscription/connexion)  
✅ **Sauvegarde de substituts** dans la bibliothèque personnelle  
✅ **Interface responsive** avec React  
✅ **API REST** complète avec Django REST Framework  

## Structure du projet

```
GameSub/
├── GameSub/           # Configuration Django
├── games/             # App principale Django
│   ├── models.py      # Modèles de données
│   ├── views.py       # Vues API
│   ├── serializers.py # Sérialiseurs REST
│   ├── services.py    # Service API RAWG
│   └── urls.py        # URLs de l'app
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/ # Composants React
│   │   ├── pages/      # Pages de l'app
│   │   ├── services/   # Service API
│   │   └── contexts/   # Contextes React
│   └── package.json
├── requirements.txt   # Dépendances Python
└── .env              # Variables d'environnement
```

## Endpoints API

- `GET /api/search/?q=query` - Rechercher des jeux
- `GET /api/substitutes/{game_id}/` - Obtenir les substituts d'un jeu  
- `GET /api/my-substitutes/` - Substituts sauvegardés (auth requise)
- `POST /api/my-substitutes/` - Sauvegarder un substitut (auth requise)
- `POST /api/auth/register/` - Créer un compte
- `POST /api/auth/login/` - Se connecter
- `POST /api/auth/logout/` - Se déconnecter

## Troubleshooting

### Erreur de base de données
- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez les paramètres de connexion dans `.env`
- Assurez-vous que la base de données existe

### Erreur API RAWG
- Vérifiez que votre clé API RAWG est valide
- Vérifiez votre connexion internet
- La clé gratuite a une limite de requêtes par jour

### Erreur CORS
- Assurez-vous que Django et React tournent sur les bons ports (8000 et 3000)
- Les URLs de CORS sont configurées dans `settings.py`