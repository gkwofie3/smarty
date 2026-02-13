@echo off
echo Installing PyInstaller...
python -m pip install pyinstaller
if %errorlevel% neq 0 (
    echo Failed to install PyInstaller.
    exit /b %errorlevel%
)

echo Building Smarty Executable...
python -m PyInstaller --onefile --noconsole --name smarty smarty.py
if %errorlevel% neq 0 (
    echo Failed to build Smarty Executable.
    exit /b %errorlevel%
)

echo BUILD_COMPLETE
