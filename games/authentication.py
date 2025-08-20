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
        print("🔑 Authorization reçu:", auth_header)

        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        print("📌 Token reçu:", token[:20], "...")

        try:
            # ⚠️ Pour tests : décodage sans vérifier la signature
            payload = jwt.decode(token, options={"verify_signature": False})
            print("✅ Payload décodé:", payload)

            user_id = payload.get("sub") or payload.get("user_id")
            email = payload.get("email")
            if not user_id:
                raise exceptions.AuthenticationFailed("Pas d'user_id dans le token")

            user = SupabaseUser(user_id=user_id, email=email, payload=payload)
            return (user, token)

        except Exception as e:
            print("❌ Erreur JWT:", e)
            raise exceptions.AuthenticationFailed("Token invalide")
