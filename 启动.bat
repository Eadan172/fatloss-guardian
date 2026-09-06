@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d %~dp0
title 减重守护台 · 一键启动

echo ============================================
echo   减重守护台 FatLoss Guardian 正在启动...
echo ============================================
echo.

docker info >nul 2>&1
if not errorlevel 1 goto docker_ready

echo [1/3] Docker 未运行，正在启动 Docker Desktop，请稍候...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
set /a retry=0

:wait_docker
timeout /t 3 /nobreak >nul
docker info >nul 2>&1
if not errorlevel 1 goto docker_ready
set /a retry+=1
if !retry! geq 40 (
  echo.
  echo Docker 启动超时，请手动打开 Docker Desktop 后重新双击本脚本。
  pause
  exit /b 1
)
goto wait_docker

:docker_ready
echo [1/3] Docker 已就绪。
echo [2/3] 构建并启动容器（首次需拉取镜像，请耐心等待）...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo 启动失败，请检查上方错误信息。
  pause
  exit /b 1
)

echo [3/3] 打开浏览器 http://localhost:8080 ...
start "" "http://localhost:8080"

echo.
echo ============================================
echo   完成！平台数据自动读取本机 data\backup.json
echo   需要关闭平台时：双击「停止.bat」
echo ============================================
pause
