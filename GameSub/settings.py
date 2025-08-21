from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# =========================
# Security & Debug
# =========================
SECRET_KEY = config("SECRET_KEY")  # ⚠️ OBLIGATOIRE en production
DEBUG = config("DEBUG", default=False, cast=bool)  # False par défaut pour la sécurité
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")

# Validation en production
if not DEBUG and SECRET_KEY == "unsafe-secret-key":
    raise ValueError("SECRET_KEY must be set in production environment")

# =========================
# Installed Apps
# =========================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'games',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =========================
# Security Headers
# =========================
if not DEBUG:
    # HTTPS obligatoire en production
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Headers de sécurité
    SECURE_HSTS_SECONDS = 31536000  # 1 an
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    
    # Cookies sécurisés
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'

ROOT_URLCONF = 'GameSub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'GameSub.wsgi.application'

# =========================
# Database (Supabase)
# =========================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='postgres'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# =========================
# Password Validation
# =========================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =========================
# Internationalization
# =========================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# =========================
# Static files
# =========================
STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =========================
# Django REST Framework
# =========================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'games.authentication.SupabaseAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# =========================
# CORS Configuration
# =========================
# Configuration différente selon l'environnement
CORS_ALLOWED_ORIGINS_ENV = config("CORS_ALLOWED_ORIGINS", default="")

if not DEBUG and CORS_ALLOWED_ORIGINS_ENV:
    # Production : utilise les domaines spécifiés dans les variables d'environnement
    CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_ENV.split(",")
    CORS_ALLOW_ALL_ORIGINS = False
else:
    # Développement : autorise une gamme de ports localhost
    CORS_ALLOWED_ORIGINS = []
    for port in range(3000, 3011):  # Ports React (3000-3010)
        CORS_ALLOWED_ORIGINS.extend([
            f"http://localhost:{port}",
            f"http://127.0.0.1:{port}",
        ])
    CORS_ALLOW_ALL_ORIGINS = False

# Options CORS sécurisées
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =========================
# Supabase Configuration
# =========================
SUPABASE_URL = config("SUPABASE_URL", default="")
SUPABASE_ANON_KEY = config("SUPABASE_ANON_KEY", default="")

if not SUPABASE_URL and not DEBUG:
    raise ValueError("SUPABASE_URL environment variable is required in production")

if not SUPABASE_ANON_KEY and not DEBUG:
    raise ValueError("SUPABASE_ANON_KEY environment variable is required in production")

# =========================
# RAWG API
# =========================
RAWG_API_KEY = config("RAWG_API_KEY", default="c27339648d8140afbf1219f346108ca6")
RAWG_BASE_URL = "https://api.rawg.io/api"

if not RAWG_API_KEY and not DEBUG:
    raise ValueError("RAWG_API_KEY environment variable is required in production")

# =========================
# Cache Configuration
# =========================
# Configuration différente selon l'environnement
REDIS_URL = config("REDIS_URL", default=None)

if not DEBUG and REDIS_URL:
    # Production avec Redis - Optimisé pour 30MB
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': 10,  # Réduit pour économiser
                    'retry_on_timeout': True,
                },
                # Politique d'éviction automatique
                'REDIS_CLIENT_KWARGS': {
                    'decode_responses': True,
                },
            },
            'KEY_PREFIX': 'gs',  # Préfixe court pour économiser
            'TIMEOUT': 180,  # 3 minutes par défaut (réduit)
            'VERSION': 1,
        }
    }
else:
    # Développement avec cache local
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'gamesub-cache',
            'TIMEOUT': 300,
            'OPTIONS': {
                'MAX_ENTRIES': 1000,
                'CULL_FREQUENCY': 3,
            }
        }
    }
