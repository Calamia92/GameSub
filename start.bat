@echo off
echo [GAMESUB] Demarrage des serveurs avec ports dynamiques...

echo [GAMESUB] Arret des serveurs existants...
taskkill /f /im python.exe /fi "WINDOWTITLE eq *runserver*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq *react-scripts*" >nul 2>&1

echo [GAMESUB] Demarrage Django...
start /b python start_django.py

echo [GAMESUB] Attente pour Django...
timeout /t 3 /nobreak >nul

echo [GAMESUB] Demarrage React...
cd frontend
start /b node start_frontend.js
cd ..

echo [GAMESUB] Serveurs en cours de demarrage...
timeout /t 3 /nobreak >nul

echo [GAMESUB] Ports utilises:
if exist django_port.txt (
    set /p DJANGO_PORT=<django_port.txt
    echo    Django: http://localhost:!DJANGO_PORT!
) else (
    echo    Django: http://localhost:8001 (par defaut)
)

if exist frontend\react_port.txt (
    set /p REACT_PORT=<frontend\react_port.txt
    echo    React:  http://localhost:!REACT_PORT!
) else (
    echo    React:  http://localhost:3001 (par defaut)
)

echo [GAMESUB] Pret ! Appuyez sur une touche pour arreter les serveurs.
pause >nul

echo [GAMESUB] Arret des serveurs...
taskkill /f /im python.exe /fi "WINDOWTITLE eq *runserver*" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq *react-scripts*" >nul 2>&1

del django_port.txt >nul 2>&1
del frontend\react_port.txt >nul 2>&1

echo [GAMESUB] Serveurs arretes.