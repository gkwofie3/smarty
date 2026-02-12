import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from fbd.models import FBDProgram
from fbd.executor import FBDExecutor

def debug_runtime():
    # Attempt to find any program or create a mock one if empty
    program = FBDProgram.objects.first()
    if not program:
        print("No FBD program found in DB to test with.")
        return

    print(f"Testing Program: {program.id} - {program.name}")
    try:
        executor = FBDExecutor(program)
        print("Executor initialized.")
        results = executor.execute_cycle()
        print("Execution cycle completed.")
        
        flattened = {}
        for node_id, outputs in results.items():
            for i, val in enumerate(outputs):
                flattened[f"{node_id}_out_{i}"] = val
        
        print(f"Flattened results (first 5): {list(flattened.items())[:5]}")
        print("SUCCESS")
    except Exception as e:
        import traceback
        print("FAILURE")
        traceback.print_exc()

if __name__ == "__main__":
    debug_runtime()
