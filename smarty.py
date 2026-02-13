import subprocess
import time
import os
import sys
import datetime

def get_base_dir():
    """Returns the base directory of the executable or script."""
    if getattr(sys, 'frozen', False):
        # Running as compiled .exe
        return os.path.dirname(sys.executable)
    else:
        # Running as .py script
        return os.path.dirname(os.path.abspath(__file__))

BASE_DIR = get_base_dir()
LOG_FILE = os.path.join(BASE_DIR, "smarty_debug.log")

def log(message):
    """Writes a message to the log file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    # Force UTF-8 encoding for the log file to avoid future issues
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")
    print(message)

def start_hidden_process(command, cwd=BASE_DIR, name="Process"):
    """Starts a process in the background, hidden from the taskbar."""
    log(f"Starting {name}...")
    log(f"  Command: {' '.join(command)}")
    log(f"  CWD: {cwd}")
    
    if not os.path.exists(cwd):
        log(f"  [ERROR] Directory does not exist: {cwd}")
        return False

    executable_check = command[0]
    if not os.path.isabs(executable_check):
         executable_check = os.path.join(cwd, command[0])
    
    # Simple check if "file" exists, though for commands like 'npm' or 'python' verification is harder
    # log(f"  executable check: {executable_check}") 

    # Windows-specific flags to hide the window
    startupinfo = subprocess.STARTUPINFO()
    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startupinfo.wShowWindow = subprocess.SW_HIDE

    # Creation flags to detach the process
    creationflags = subprocess.CREATE_NO_WINDOW

    try:
        # We redirect stdout/stderr to the log file or DEVNULL
        # For debugging, let's keep them distinct if possible, or just ignore if we trust the start
        subprocess.Popen(
            command,
            cwd=cwd,
            startupinfo=startupinfo,
            creationflags=creationflags,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            close_fds=True
        )
        log(f"  [OK] {name} started successfully (PID hidden).")
        return True
    except Exception as e:
        log(f"  [ERROR] Failed to start {name}: {e}")
        return False

def main():
    # Clear previous log
    with open(LOG_FILE, "w") as f:
        f.write("=== Smarty Launcher Debug Log ===\n")

    log(f"Initializing Smarty System from: {BASE_DIR}")

    # Define paths
    SERVICE_PATH = os.path.join(BASE_DIR, "service", "SmartyService", "bin", "Debug", "net9.0", "SmartyService.exe")
    DJANGO_MANAGE_PATH = os.path.join(BASE_DIR, "server", "manage.py")
    REACT_APPS = [
        ("Main App", os.path.join(BASE_DIR, "main")),
        ("Editor App", os.path.join(BASE_DIR, "editor")),
        ("FDB App", os.path.join(BASE_DIR, "fdb")),
        ("Client App", os.path.join(BASE_DIR, "client")),
        ("Script App", os.path.join(BASE_DIR, "script"))
    ]

    # 1. Start C# Service
    if os.path.exists(SERVICE_PATH):
        start_hidden_process([SERVICE_PATH], cwd=os.path.dirname(SERVICE_PATH), name="SmartyService")
    else:
        log(f"[ERROR] SmartyService not found at {SERVICE_PATH}")
    
    time.sleep(2)

    # 2. Start Django Server
    # We assume 'python' is in PATH. If running from embedded environment, might need adjustment.
    # Attempt to find python. If we are running as exe, sys.executable is the app itself, not python.exe.
    # We will trust system 'python' for now.
    python_cmd = "python" 
    
    if os.path.exists(DJANGO_MANAGE_PATH):
        start_hidden_process([python_cmd, "manage.py", "runserver", "0.0.0.0:5000"], cwd=os.path.dirname(DJANGO_MANAGE_PATH), name="Django Server")
    else:
        log(f"[ERROR] manage.py not found at {DJANGO_MANAGE_PATH}")

    time.sleep(2)

    # 3. Start React Apps
    for app_name, app_path in REACT_APPS:
        if os.path.exists(os.path.join(app_path, "package.json")):
             # Using 'npm.cmd' for Windows
            start_hidden_process(["npm.cmd", "run", "dev"], cwd=app_path, name=app_name)
        else:
            log(f"[ERROR] package.json not found in {app_path}")

    log("Launch sequence completed.")
    log("   Services are running in the background.")
    log("   - Main:   http://localhost:5001")
    log("   - Editor: http://localhost:5002")
    log("   - FDB:    http://localhost:5003")
    log("   - Client: http://localhost:5004")
    log("   - Script: http://localhost:5005")
    log("   - Django: http://localhost:5000")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        with open("smarty_critical_error.log", "w") as f:
            f.write(str(e))
