@echo off
setlocal

echo 🚀 WhatsApp Blast Docker Deployment
echo ==================================

if "%1"=="" goto usage

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)
echo ✅ Docker is running

if "%1"=="compose" goto deploy_compose
if "%1"=="docker" goto deploy_docker
if "%1"=="logs" goto show_logs
if "%1"=="stop" goto stop_app
goto usage

:deploy_compose
echo 📦 Building and starting with docker-compose...
docker-compose down >nul 2>&1
docker-compose build
docker-compose up -d

if errorlevel 0 (
    echo ✅ Application deployed successfully!
    echo 🌐 Access: http://localhost:3000
    echo 📊 Logs: docker-compose logs -f whatsapp-blast
) else (
    echo ❌ Deployment failed!
    exit /b 1
)
goto end

:deploy_docker
echo 📦 Building Docker image...
docker build -t whatsapp-blast .

if errorlevel 0 (
    echo ✅ Image built successfully!
    
    REM Stop existing container if running
    docker stop wa-blast-container >nul 2>&1
    docker rm wa-blast-container >nul 2>&1
    
    echo 🚀 Starting container...
    docker run -d --name wa-blast-container -p 3000:3000 -v "%cd%\auth_info_baileys:/app/auth_info_baileys" whatsapp-blast
    
    if errorlevel 0 (
        echo ✅ Container started successfully!
        echo 🌐 Access: http://localhost:3000
        echo 📊 Logs: docker logs -f wa-blast-container
    ) else (
        echo ❌ Failed to start container!
        exit /b 1
    )
) else (
    echo ❌ Failed to build image!
    exit /b 1
)
goto end

:show_logs
echo 📊 Showing application logs...
if exist "docker-compose.yml" (
    docker-compose logs -f whatsapp-blast
) else (
    docker logs -f wa-blast-container
)
goto end

:stop_app
echo 🛑 Stopping application...
if exist "docker-compose.yml" (
    docker-compose down
) else (
    docker stop wa-blast-container >nul 2>&1
    docker rm wa-blast-container >nul 2>&1
)
echo ✅ Application stopped!
goto end

:usage
echo Usage: %0 {compose^|docker^|logs^|stop}
echo.
echo Commands:
echo   compose  - Deploy using docker-compose (recommended)
echo   docker   - Deploy using Docker only
echo   logs     - Show application logs
echo   stop     - Stop the application
echo.
echo Examples:
echo   %0 compose    # Deploy with docker-compose
echo   %0 logs       # View logs
echo   %0 stop       # Stop application
exit /b 1

:end
endlocal
