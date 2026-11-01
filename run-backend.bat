@echo off
title Serveur Backend PHP - Medcine Solution
echo ====================================================
echo  Lancement du Serveur Backend PHP - Medcine Solution
echo ====================================================
echo Base de donnees : medcine_solution_db (MySQL localhost)
echo Port du serveur : http://127.0.0.1:8000/
echo.

IF EXIST "C:\xamppp\php\php.exe" (
    SET "PHP_CMD=C:\xamppp\php\php.exe"
) ELSE IF EXIST "C:\xampp\php\php.exe" (
    SET "PHP_CMD=C:\xampp\php\php.exe"
) ELSE (
    SET "PHP_CMD=php"
)

echo Demarrage avec : %PHP_CMD%
set PHP_CLI_SERVER_WORKERS=4
%PHP_CMD% -S 127.0.0.1:8000 -t backend backend/router.php
pause
