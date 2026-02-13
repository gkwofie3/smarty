from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
import os

SECRET_KEY = 'django-insecure-o$fy7+6xkw0b$s9sstcw7km(ea%ggcrh%$wr@=o88k#+(rmd$g'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'users',
    'fbd',
    'main',
    'devices',
    'modules',
    'graphics',
    'script',
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

ROOT_URLCONF = 'server.urls'

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


CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

WSGI_APPLICATION = 'server.wsgi.application'


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


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True



DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'





# ----------------------------------------------------------------------------------------------------------------------


CLIENT_NAME='Twellium BMS'
ONLINE_DOMAIN="rovidgh.com"
ALLOWED_HOSTS = [ONLINE_DOMAIN,'127.0.0.1', 'localhost']
DATA_UPLOAD_MAX_NUMBER_FIELDS = 5120000
# Application definition


ROOT_URLCONF = 'server.urls'


AUTH_USER_MODEL='users.User'
LOGIN_URL='/users/login'


# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }
DATABASES = {
# 1. Your Django App's Primary Database
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'smarty',
        'USER': 'smartyapp',
        'PASSWORD': 'utf-8.roRo@2k25_pacman',
        'HOST': 'localhost',
        'PORT': '5432',
    },
}

# MESSAGE_TAGS ={
#     messages.DEBUG:'alert-secondary',
#     messages.INFO:'alert-info',
#     messages.SUCCESS:'alert-success',
#     messages.WARNING:'alert-warning',
#     messages.ERROR:'alert-danger'
# }


LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Accra'
USE_I18N = True
USE_TZ = True



STATIC_URL = '/static/'
STATICFILES_DIRS=(os.path.join(BASE_DIR,'static'),)
MEDIA_URL ='/media/'
MEDIA_ROOT =os.path.join(BASE_DIR,'media/')


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# Email settings for Gmail
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER ='rovidghana@gmail.com' 
EMAIL_HOST_PASSWORD = 'vctkhpkepankcgmx'
DEFAULT_FROM_EMAIL = 'Rovid Smarty <rovidghana@gmail.com>'

SMS_API_KEY='4d94779e03f1a55e06b849bb42710b568c2f3779781788425994bb8916b33f21'

# ----------------------------------------------------------------------------------------------------------------------
# AI & Celery Configuration
# ----------------------------------------------------------------------------------------------------------------------

# Celery
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Ollama & AI
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.1:8b"  # Default model
# RAG Persistence
CHROMA_DB_PATH = os.path.join(BASE_DIR, 'chroma_db')

# Ensure 'ai' is in INSTALLED_APPS if not already
if 'ai' not in INSTALLED_APPS:
    INSTALLED_APPS.append('ai')
    INSTALLED_APPS.append('django_celery_beat')
