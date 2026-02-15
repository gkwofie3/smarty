@echo off
echo ==========================================
echo      Smarty Executable Setup Script
echo ==========================================
echo.
echo This script will:
echo 1. Install PyInstaller (needed to create .exe)
echo 2. Compile smarty.py into smarty.exe
echo.
pause

echo.
echo [1/2] Installing Dependencies (PyInstaller, pywebview)...
pip install pyinstaller pywebview
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies.
    pause
    exit /b %errorlevel%
)

echo [2/3] Converting Icons (PNG to ICO)...
python convert_icons.py
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Icon conversion failed or skipped. Default icons may be used.
)

echo.
echo [3/3] Building Executables...

echo   - Building Smarty Launcher (Background Engine)...
pyinstaller --onefile --noconsole --name smarty --icon main\public\logo.ico smarty.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Main...
pyinstaller --onefile --noconsole --name SmartyMain --icon main\public\logo.ico run_main.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Editor...
pyinstaller --onefile --noconsole --name SmartyEditor --icon editor\public\editor.ico run_editor.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty FDB...
pyinstaller --onefile --noconsole --name SmartyFDB --icon fdb\public\fdb.ico run_fdb.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Client...
pyinstaller --onefile --noconsole --name SmartyClient --icon client\public\client.ico run_client.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Script...
pyinstaller --onefile --noconsole --name SmartyScript --icon script\public\script.ico run_script.py
if %errorlevel% neq 0 goto build_fail

echo.
echo ✅ Success! All executables created in 'dist' folder.
echo      Moving valid executables to root...
move /Y dist\smarty.exe .
move /Y dist\SmartyMain.exe .
move /Y dist\SmartyEditor.exe .
move /Y dist\SmartyFDB.exe .
move /Y dist\SmartyClient.exe .
move /Y dist\SmartyScript.exe .

rd /S /Q build
rd /S /Q dist
del *.spec

echo.
echo ==========================================
echo      Ready to use!
echo.
echo      1. Double-click 'smarty.exe' FIRST (starts background services)
echo      2. Double-click any App EXE (e.g. 'SmartyMain.exe') to open it
echo.
echo      If it fails, check 'smarty.log'.
echo ==========================================
pause
exit /b 0

:build_fail
echo.
echo ❌ Compilation failed.
pause
exit /b %errorlevel%
