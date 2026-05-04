# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime stage - using nginx to serve
FROM nginx:alpine

# Create nginx config
RUN rm /etc/nginx/conf.d/default.conf && \
    echo 'server {\n\
    listen 8000;\n\
    server_name _;\n\
    gzip on;\n\
    gzip_types text/plain text/css text/javascript application/javascript application/json;\n\
    gzip_min_length 1000;\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 30d;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
    location = / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location / {\n\
        alias /usr/share/nginx/html/;\n\
        try_files $uri $uri/ /index.html;\n\
        add_header Cache-Control "public, max-age=0";\n\
    }\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header X-XSS-Protection "1; mode=block" always;\n\
}' > /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
