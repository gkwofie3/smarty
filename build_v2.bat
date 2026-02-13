@echo off
echo STARTING BUILD > build.log
echo Installing PyInstaller... >> build.log
python -m pip install pyinstaller >> build.log 2>&1
if %errorlevel% neq 0 (
    echo Failed to install PyInstaller. >> build.log
    exit /b %errorlevel%
)

echo Building Smarty Executable... >> build.log
python -m PyInstaller --onefile --noconsole --name smarty smarty.py >> build.log 2>&1
if %errorlevel% neq 0 (
    echo Failed to build Smarty Executable. >> build.log
    exit /b %errorlevel%
)

echo BUILD_COMPLETE >> build.log
