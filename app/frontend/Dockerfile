# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy frontend package file
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies at root (including workspaces)
RUN npm install

# Build arguments para Vite (necesarios en tiempo de build)
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_TENANT_ID
ARG VITE_API_URL

# Set environment variables for the build process
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_API_URL=$VITE_API_URL

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build the frontend
RUN npm run build -w apps/frontend

# Production stage
FROM nginx:stable-alpine

# Copy built files from build stage
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx config (soporte para React Router / SPA)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
