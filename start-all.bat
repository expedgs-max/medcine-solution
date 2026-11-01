@echo off
title Medcine Solution - Lanceur Complet
echo ====================================================
echo  Lancement de l'application Medcine Solution
echo ====================================================

:: Detection du dossier XAMPP (C:\xamppp ou C:\xampp)
SET "XAMPP_DIR="
IF EXIST "C:\xamppp" (
    SET "XAMPP_DIR=C:\xamppp"
) ELSE IF EXIST "C:\xampp" (
    SET "XAMPP_DIR=C:\xampp"
)

:: 1. Verifier MySQL
echo [1/3] Verification de MySQL...
netstat -ano | findstr ":3306" >nul 2>&1
if not errorlevel 1 (
    echo MySQL est deja actif sur le port 3306.
) else (
    netstat -ano | findstr ":3307" >nul 2>&1
    if not errorlevel 1 (
        echo MySQL est deja actif sur le port 3307.
    ) else (
        echo Demarrage de MySQL...
        if defined XAMPP_DIR (
            start "" /B "%XAMPP_DIR%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP_DIR%\mysql\bin\my.ini" --standalone
            timeout /t 3 /nobreak >nul
        ) else (
            echo [ATTENTION] MySQL non trouve.
        )
    )
)

:: 2. Demarrer le Backend PHP sur le port 8000
echo [2/3] Lancement du Backend PHP sur http://127.0.0.1:8000...
netstat -ano | findstr ":8000" >nul 2>&1
if errorlevel 1 (
    if defined XAMPP_DIR (
        start "Backend PHP - Medcine Solution" cmd /k "cd /d %~dp0 && set PHP_CLI_SERVER_WORKERS=4 && %XAMPP_DIR%\php\php.exe -S 127.0.0.1:8000 -t backend backend/router.php"
    ) else (
        start "Backend PHP - Medcine Solution" cmd /k "cd /d %~dp0 && set PHP_CLI_SERVER_WORKERS=4 && php -S 127.0.0.1:8000 -t backend backend/router.php"
    )
) else (
    echo Backend PHP est deja actif sur le port 8000.
)

:: 3. Demarrer le Frontend React sur le port 5173
echo [3/3] Lancement du Frontend React sur http://localhost:5173...
netstat -ano | findstr ":5173" >nul 2>&1
if errorlevel 1 (
    start "Frontend React - Medcine Solution" cmd /k "cd /d %~dp0frontend && npm start"
) else (
    echo Frontend React est deja actif sur le port 5173.
)

start http://localhost:5173

echo.
echo ====================================================
echo  Tous les services sont prets !
echo  - Frontend React : http://localhost:5173
echo  - Backend API PHP: http://127.0.0.1:8000
echo ====================================================
timeout /t 5 >nul
exit
