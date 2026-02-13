import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

def verify_ai_setup():
    print("Verifying AI App Setup...")
    
    # 1. Check App Config
    from django.apps import apps
    if not apps.is_installed('ai'):
        print("[FAIL] 'ai' app is not installed.")
        return
    print("[PASS] 'ai' app is installed.")
    
    # 2. Check Settings
    try:
        print(f"OLLAMA_BASE_URL: {settings.OLLAMA_BASE_URL}")
        print(f"CELERY_BROKER_URL: {settings.CELERY_BROKER_URL}")
        print(f"CHROMA_DB_PATH: {settings.CHROMA_DB_PATH}")
        print("[PASS] Settings configured.")
    except AttributeError as e:
        print(f"[FAIL] Missing setting: {e}")
        
    # 3. Check Imports
    try:
        from ai.engine import AIEngine
        from ai.rag import VectorStoreManager
        from ai.tools import list_all_points
        print("[PASS] AI modules imported successfully.")
    except ImportError as e:
        print(f"[FAIL] Import error: {e}")
        return

    print("\nSetup verification complete. Please run migrations and start Ollama.")

if __name__ == '__main__':
    verify_ai_setup()
