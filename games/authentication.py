from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
import jwt

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
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]

        try:
            # Décodage JWT sans vérifier la signature (pour tests)
            # En production: ajouter la vérification de signature
            payload = jwt.decode(token, options={"verify_signature": False})

            user_id = payload.get("sub") or payload.get("user_id")
            email = payload.get("email")
            if not user_id:
                raise exceptions.AuthenticationFailed("Pas d'user_id dans le token")

            user = SupabaseUser(user_id=user_id, email=email, payload=payload)
            return (user, token)

        except Exception as e:
            raise exceptions.AuthenticationFailed("Token invalide")
