from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
import jwt
from django.conf import settings
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
    """
    Authentification JWT pour Supabase avec clés symétriques (HMAC)
    Compatible avec les projets Supabase existants qui utilisent HS256
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]

        try:
            # Vérification JWT sécurisée avec la vraie clé secrète Supabase
            secret_key = settings.SUPABASE_JWT_SECRET
            
            payload = jwt.decode(
                token,
                secret_key,
                algorithms=["HS256"],
                options={
                    "verify_signature": True,  # Vérification complète activée
                    "verify_exp": True,
                    "verify_aud": False,  # Supabase n'utilise pas toujours audience
                }
            )

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
