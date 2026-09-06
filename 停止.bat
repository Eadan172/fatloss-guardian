@echo off
chcp 65001 >nul
cd /d %~dp0
echo 正在停止减重守护台容器...
docker compose down
echo.
echo 已停止。数据仍保存在本机 data\backup.json，下次启动自动恢复。
pause
