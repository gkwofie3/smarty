import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from script.models import ScriptProgram
from script.executor import ScriptExecutor

try:
    s = ScriptProgram.objects.get(id=1)
    print(f"SCRIPT 1: {s.name}")
    print("--- CODE ---")
    print(s.code_text)
    print("------------")
    
    executor = ScriptExecutor(s)
    decls = executor.parse()
    print(f"DECLARATIONS: {decls}")
    print("--- GENERATED PYTHON ---")
    print(executor.python_code)
    print("------------------------")
    
    compile(executor.python_code, '<string>', 'exec')
    print("SYNTAX OK")
except Exception as e:
    import traceback
    print(f"ERROR: {str(e)}")
    print(traceback.format_exc())
