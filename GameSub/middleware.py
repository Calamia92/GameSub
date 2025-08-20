import jwt
import json
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from supabase import create_client, Client
from decouple import config

class SupabaseJWTMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # Configuration Supabase
        self.supabase_url = config('SUPABASE_URL')
        self.supabase_anon_key = config('SUPABASE_ANON_KEY')
        self.supabase: Client = create_client(self.supabase_url, self.supabase_anon_key)

    def __call__(self, request):
        # Traiter la requête avant la vue
        self.process_request(request)
        response = self.get_response(request)
        return response

    def process_request(self, request):
        # Ignorer certaines routes
        if self.should_skip_auth(request.path):
            request.user = AnonymousUser()
            return

        # Récupérer le token JWT de l'en-tête Authorization
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            request.user = AnonymousUser()
            return

        token = auth_header.split(' ')[1]

        try:
            # Vérifier le token avec Supabase
            user_data = self.verify_supabase_token(token)
            if user_data:
                # Créer un objet utilisateur personnalisé
                request.user = SupabaseUser(user_data)
                request.supabase_session = token
            else:
                request.user = AnonymousUser()
                
        except Exception as e:
            print(f"Token verification error: {e}")
            request.user = AnonymousUser()

    def verify_supabase_token(self, token):
        """
        Vérifie le token JWT Supabase et retourne les données utilisateur
        """
        try:
            # Récupérer la clé publique JWT de Supabase (simplified version)
            # En production, il faudrait récupérer les clés depuis /.well-known/jwks.json
            
            # Décoder le token sans vérifier la signature pour récupérer les données
            # ATTENTION: En production, il faut vérifier la signature
            decoded_token = jwt.decode(
                token,
                options={"verify_signature": False}  # TEMPORAIRE - à modifier en prod
            )
            
            # Vérifier que le token contient les informations nécessaires
            if 'sub' in decoded_token and 'email' in decoded_token:
                return {
                    'id': decoded_token.get('sub'),
                    'email': decoded_token.get('email'),
                    'user_metadata': decoded_token.get('user_metadata', {}),
                    'app_metadata': decoded_token.get('app_metadata', {}),
                }
            
            return None
            
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            print(f"Token decode error: {e}")
            return None

    def should_skip_auth(self, path):
        """
        Définit les routes qui ne nécessitent pas d'authentification
        """
        skip_paths = [
            '/admin/',
            '/api/auth/',  # Garder pour compatibilité temporaire
            '/static/',
            '/media/',
        ]
        
        return any(path.startswith(skip_path) for skip_path in skip_paths)


class SupabaseUser:
    """
    Objet utilisateur personnalisé pour Supabase
    Compatible avec le système d'authentification Django
    """
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.email = user_data.get('email')
        self.user_metadata = user_data.get('user_metadata', {})
        self.app_metadata = user_data.get('app_metadata', {})
        self.username = self.user_metadata.get('username', self.email)
        self.first_name = self.user_metadata.get('first_name', '')
        self.last_name = self.user_metadata.get('last_name', '')
        
    @property
    def is_authenticated(self):
        return True
    
    @property
    def is_anonymous(self):
        return False
    
    @property
    def is_active(self):
        return True
    
    def __str__(self):
        return self.email or self.username or self.id