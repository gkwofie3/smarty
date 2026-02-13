import subprocess
import sys
import os

def install_and_build():
    log_file = "build_python.log"
    with open(log_file, "w") as f:
        f.write("Starting build process...\n")
        f.flush()
        
        # Install PyInstaller
        f.write("Installing PyInstaller...\n")
        f.flush()
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"], stdout=f, stderr=f)
        except subprocess.CalledProcessError as e:
            f.write(f"Install failed with return code {e.returncode}\n")
            return
        except Exception as e:
            f.write(f"Install failed: {e}\n")
            return

        # Build Executable
        f.write("Building Smarty Executable...\n")
        f.flush()
        try:
            subprocess.check_call([sys.executable, "-m", "PyInstaller", "--onefile", "--noconsole", "--name", "smarty", "smarty.py"], stdout=f, stderr=f)
        except subprocess.CalledProcessError as e:
            f.write(f"Build failed with return code {e.returncode}\n")
            return
        except Exception as e:
            f.write(f"Build failed: {e}\n")
            return

        f.write("BUILD_COMPLETE\n")

if __name__ == "__main__":
    install_and_build()
