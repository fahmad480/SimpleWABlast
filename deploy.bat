@echo off
echo 🚀 WhatsApp Blast - Docker Deployment
echo ====================================

if "%1"=="" goto usage

if "%1"=="build" goto build
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="logs" goto logs
goto usage

:build
echo 📦 Building Docker image...
docker compose build
goto end

:start
echo � Starting application...
docker compose up -d
echo ✅ Application started!
echo 🌐 Access: http://localhost:3000
goto end

:stop
echo � Stopping application...
docker compose down
echo ✅ Application stopped!
goto end

:logs
echo � Showing logs...
docker compose logs -f whatsapp-blast
goto end

:usage
echo Usage: %0 {build^|start^|stop^|logs}
echo.
echo Commands:
echo   build  - Build Docker image
echo   start  - Start application
echo   stop   - Stop application
echo   logs   - Show application logs
echo.
echo Examples:
echo   %0 build     # Build image
echo   %0 start     # Start app
echo   %0 logs      # View logs
exit /b 1

:end
