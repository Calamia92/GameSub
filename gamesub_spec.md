Créer une WebApp (Django + React + PostgreSQL via Supabase) qui permet aux joueurs de trouver des alternatives à leurs jeux favoris (“substituts vidéoludiques”) en utilisant une API jeux vidéo (RAWG.io ou IGDB).
L’application doit permettre de rechercher un jeu, obtenir des suggestions de substituts, et enregistrer les résultats.

🔑 Parcours utilisateur

L’utilisateur crée un compte et se connecte.

Il choisit :

(1) Rechercher un jeu (par nom, genre, plateforme, année)

(2) Entrer directement l’ID/API d’un jeu

(3) Consulter “Mes substituts” (historique)

Pour un jeu donné, l’app propose :

Substituts pertinents (similaires genre/tags)

Description, note, durée, PEGI, plateformes

Lien vers l’API (RAWG/IGDB) et store si dispo

L’utilisateur peut sauvegarder le substitut dans sa bibliothèque.

🗄️ Base de données (PostgreSQL/Supabase)

Tables principales :

users : comptes utilisateurs

games : infos de base (id externe, nom, genres, plateformes, note, durée, PEGI, url, store)

substitutions : relation user_id + source_game_id + substitute_game_id + justification

user_games (optionnel) : favoris ou wishlist

💻 Développement attendu

Scripts Python : récupération des jeux via API, insertion en base.

Backend Django :

Authentification

Endpoints : recherche jeux, suggestions, historique utilisateur

Frontend React :

Recherche + filtres

Fiche jeu + suggestions substituts

Page “Mes substituts”