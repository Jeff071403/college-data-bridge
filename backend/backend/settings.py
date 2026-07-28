from pathlib import Path
import os
from datetime import timedelta
import psycopg2
import environ
<<<<<<< HEAD

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize env
env = environ.Env()

# Read .env file if it exists
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-+=t3a@n8j5g#$-rdym+*70zi*_8fvf=r*-jh5fm^u8#-6f%j7o')

DEBUG = env.bool('DEBUG', default=True)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['*'])
=======
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environment variables reader
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['*'])
)

# Read environment variables
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# Verify required configuration variables
required_vars = [
    'SECRET_KEY',
    'GOOGLE_SERVICE_ACCOUNT_FILE',
    'GOOGLE_DRIVE_ROOT_FOLDER_ID',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
]
for var in required_vars:
    if not env(var, default=None):
        raise ImproperlyConfigured(f"Missing required environment variable: {var}")

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['*'])

# Google Drive API Configuration
GOOGLE_DRIVE_TYPE = env('GOOGLE_DRIVE_TYPE', default='service_account')
GOOGLE_DRIVE_PROJECT_ID = env('GOOGLE_DRIVE_PROJECT_ID', default='')
GOOGLE_DRIVE_PRIVATE_KEY_ID = env('GOOGLE_DRIVE_PRIVATE_KEY_ID', default='')
GOOGLE_DRIVE_PRIVATE_KEY = env('GOOGLE_DRIVE_PRIVATE_KEY', default='')
GOOGLE_DRIVE_CLIENT_EMAIL = env('GOOGLE_DRIVE_CLIENT_EMAIL', default='')
GOOGLE_DRIVE_CLIENT_ID = env('GOOGLE_DRIVE_CLIENT_ID', default='')
GOOGLE_DRIVE_AUTH_URI = env('GOOGLE_DRIVE_AUTH_URI', default='https://accounts.google.com/o/oauth2/auth')
GOOGLE_DRIVE_TOKEN_URI = env('GOOGLE_DRIVE_TOKEN_URI', default='https://oauth2.googleapis.com/token')
GOOGLE_DRIVE_AUTH_PROVIDER_CERT_URL = env('GOOGLE_DRIVE_AUTH_PROVIDER_CERT_URL', default='https://www.googleapis.com/oauth2/v1/certs')
GOOGLE_DRIVE_CLIENT_CERT_URL = env('GOOGLE_DRIVE_CLIENT_CERT_URL', default='')
GOOGLE_DRIVE_UNIVERSE_DOMAIN = env('GOOGLE_DRIVE_UNIVERSE_DOMAIN', default='googleapis.com')
GOOGLE_SERVICE_ACCOUNT_FILE = os.path.join(BASE_DIR, env('GOOGLE_SERVICE_ACCOUNT_FILE', default='credentials/google-drive.json'))
GOOGLE_DRIVE_ROOT_FOLDER_ID = env('GOOGLE_DRIVE_ROOT_FOLDER_ID', default='')

# Upload & File Constraints
MAX_UPLOAD_SIZE = env.int('MAX_UPLOAD_SIZE', default=52428800)
ALLOWED_FILE_TYPES = env.list('ALLOWED_FILE_TYPES', default=['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'])

# Logging configuration
LOG_LEVEL = env('LOG_LEVEL', default='INFO')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third Party Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Custom Apps
    'roles',
    'permissions',
    'users',
    'folders',
    'files',
    'notifications',
    'activity_logs',
    'mous',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'backend.middleware.CustomTimeMiddleware',
    'corsheaders.middleware.CorsMiddleware', # CORS Headers Middleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'backend.wsgi.application'

<<<<<<< HEAD
# Database Configuration (PostgreSQL with SQLite fallback)
DB_NAME = env('DB_NAME', default='mou_dashboard')
DB_USER = env('DB_USER', default='postgres')
DB_PASSWORD = env('DB_PASSWORD', default='password')
DB_HOST = env('DB_HOST', default='localhost')
DB_PORT = env('DB_PORT', default='5432')
=======
DB_NAME = env('DB_NAME')
DB_USER = env('DB_USER')
DB_PASSWORD = env('DB_PASSWORD')
DB_HOST = env('DB_HOST', default='localhost')
DB_PORT = env('DB_PORT', default='5432')

>>>>>>> 9a2f085 (feat: consolidate master data into settings, fix folder/file CRUD, enforce Google Drive primary storage, update user permissions, and streamline user management UI)

DATABASES = {}

try:
    # Attempt to connect to PostgreSQL to test configuration
    conn = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        connect_timeout=2
    )
    conn.close()
    
    # If connection succeeds, verify/create mou_dashboard database
    conn = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{DB_NAME}';")
    exists = cursor.fetchone()
    if not exists:
        cursor.execute(f"CREATE DATABASE {DB_NAME};")
    cursor.close()
    conn.close()

    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
    }
    print("Database Configured: PostgreSQL database 'mou_dashboard' is ready.")
except Exception as e:
    print(f"PostgreSQL connection failed ({e}). Falling back to SQLite.")
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Auth Model Override
AUTH_USER_MODEL = 'users.CustomUser'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media Files
STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# SimpleJWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15), # Increased to 15 mins for smoother development experience
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True # In production, lock down to the frontend's origin
CORS_ALLOW_CREDENTIALS = True
