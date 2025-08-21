from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
import jwt
import requests
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class SupabaseUser:
    """User personnalisé pour Supabase JWT"""
    def __init__(self, user_id, email=None, payload=None):
        self.id = user_id
        self.email = email
        self.payload = payload

    @property
    def is_authenticated(self):
        return True

class SupabaseAuthentication(BaseAuthentication):
    def __init__(self):
        super().__init__()
        self.supabase_url = settings.SUPABASE_URL
        # TTL configurable depuis .env
        from decouple import config
        self.cache_timeout = config('CACHE_TTL_JWKS', default=1800, cast=int)  # 30min par défaut

    def get_jwks(self):
        """Récupère les clés publiques JWT de Supabase avec cache"""
        cache_key = f"jwks_{hash(self.supabase_url)}"  # Clé courte
        jwks = cache.get(cache_key)
        
        if jwks is None:
            try:
                jwks_url = f"{self.supabase_url}/auth/v1/jwks"
                response = requests.get(jwks_url, timeout=10)
                response.raise_for_status()
                jwks = response.json()
                cache.set(cache_key, jwks, self.cache_timeout)
                logger.info("JWKS récupérées et mises en cache")
            except Exception as e:
                logger.error(f"Erreur lors de la récupération des JWKS: {e}")
                raise exceptions.AuthenticationFailed("Impossible de vérifier le token")
        
        return jwks

    def get_signing_key(self, token):
        """Extrait la clé de signature du token JWT"""
        try:
            # Décode l'en-tête pour obtenir le kid (key id)
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get('kid')
            
            if not kid:
                raise exceptions.AuthenticationFailed("Token sans identifiant de clé")

            # Récupère les JWKS
            jwks = self.get_jwks()
            
            # Trouve la clé correspondante
            for key in jwks.get('keys', []):
                if key.get('kid') == kid:
                    return jwt.algorithms.RSAAlgorithm.from_jwk(key)
            
            raise exceptions.AuthenticationFailed("Clé de signature non trouvée")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction de la clé: {e}")
            raise exceptions.AuthenticationFailed("Token invalide")

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]

        try:
            # Mode debug temporaire - décodage sans vérification
            # TODO: Réactiver la vérification JWT en production
            payload = jwt.decode(token, options={"verify_signature": False})

            user_id = payload.get("sub")
            email = payload.get("email")
            
            if not user_id:
                raise exceptions.AuthenticationFailed("Token sans identifiant utilisateur")

            # Vérifie l'expiration
            exp = payload.get("exp")
            if not exp:
                raise exceptions.AuthenticationFailed("Token sans date d'expiration")

            user = SupabaseUser(user_id=user_id, email=email, payload=payload)
            return (user, token)

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token expiré")
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token invalide: {e}")
            raise exceptions.AuthenticationFailed("Token invalide")
        except Exception as e:
            logger.error(f"Erreur d'authentification: {e}")
            raise exceptions.AuthenticationFailed("Erreur d'authentification")
