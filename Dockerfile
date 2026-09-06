# ---- 构建阶段 ----
FROM node:22-alpine AS build
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
