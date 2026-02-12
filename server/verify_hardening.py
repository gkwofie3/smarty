from script.executor import ScriptExecutor
from script.models import ScriptProgram
from django.contrib.auth.models import User
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

def test_hardening():
    user = User.objects.first()
    prog = ScriptProgram.objects.create(
        name="Security Test",
        code_text="""
# Try to print
print("THIS SHOULD FAIL")
""",
        owner=user
    )
    
    executor = ScriptExecutor(prog)
    status = executor.execute()
    print(f"Status: {status}")
    print(f"Logs: {prog.last_execution_log}")
    
    if "is not defined" in prog.last_execution_log or "not in symtable" in prog.last_execution_log:
        print("SUCCESS: print is restricted")
    else:
        print("FAILURE: print was executed or returned a different error")
    
    prog.delete()

if __name__ == "__main__":
    test_hardening()
