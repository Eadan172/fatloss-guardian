# ---- 构建阶段 ----
FROM node:22-alpine AS build
# 强制 DNS 先返回 IPv4：部分环境下容器内 IPv6 不可达，而 Node 会优先尝试 AAAA 记录，
# 导致 npm 访问 registry.npmjs.org 时长时间挂起（表现为 "Exit handler never called!"）。
ENV NODE_OPTIONS=--dns-result-order=ipv4first
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ---- 运行阶段：纯静态文件 + WebDAV 写本机备份，无任何外部网络调用 ----
FROM nginx:1.27-alpine
# worker 以 root 运行：写入 Windows bind-mount 的 data/ 目录需要权限（仅本机使用场景）
RUN sed -i 's/^user  nginx;/user  root;/' /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
