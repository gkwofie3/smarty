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

echo.
echo [2/2] Building Executables...

echo   - Building Smarty Launcher (Background Engine)...
pyinstaller --onefile --noconsole --name smarty smarty.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Main...
pyinstaller --onefile --noconsole --name SmartyMain run_main.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Editor...
pyinstaller --onefile --noconsole --name SmartyEditor run_editor.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty FDB...
pyinstaller --onefile --noconsole --name SmartyFDB run_fdb.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Client...
pyinstaller --onefile --noconsole --name SmartyClient run_client.py
if %errorlevel% neq 0 goto build_fail

echo   - Building Smarty Script...
pyinstaller --onefile --noconsole --name SmartyScript run_script.py
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
