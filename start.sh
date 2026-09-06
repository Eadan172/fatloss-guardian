#!/bin/sh
# 减重守护台一键启动（macOS / Linux）：docker compose up -d --build 并打开浏览器
cd "$(dirname "$0")" || exit 1

echo "============================================"
echo "  减重守护台 FatLoss Guardian 正在启动..."
echo "============================================"

if ! docker info >/dev/null 2>&1; then
  echo "Docker 未运行，请先启动 Docker Desktop / dockerd 后重试。"
  exit 1
fi

echo "[1/2] 构建并启动容器（首次需拉取镜像，请耐心等待）..."
docker compose up -d --build || exit 1

echo "[2/2] 打开浏览器 http://localhost:8080 ..."
if command -v open >/dev/null 2>&1; then
  open "http://localhost:8080"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:8080"
fi

echo "完成！平台数据自动读取本机 data/backup.json"
