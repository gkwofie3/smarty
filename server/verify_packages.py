import sys
import os

with open("verify_result.txt", "w") as f:
    f.write(f"Python: {sys.version}\n")
    try:
        import asteval
        f.write("asteval: OK\n")
    except ImportError as e:
        f.write(f"asteval: MISSING ({str(e)})\n")
    
    try:
        import RestrictedPython
        f.write("RestrictedPython: OK\n")
    except ImportError as e:
        f.write(f"RestrictedPython: MISSING ({str(e)})\n")
