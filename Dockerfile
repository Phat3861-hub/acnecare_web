# Bước 1: Build ứng dụng React với Node.js
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code vào container
COPY . .

# Chạy lệnh build của Vite (sẽ tạo ra thư mục /app/dist)
RUN npm run build

# Bước 2: Phục vụ ứng dụng bằng Nginx
FROM nginx:alpine

# Xóa trang default của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy các file tĩnh đã build từ bước 1 sang thư mục của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx (để hỗ trợ react-router-dom)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Mở port 80
EXPOSE 80

# Khởi chạy Nginx
CMD ["nginx", "-g", "daemon off;"]