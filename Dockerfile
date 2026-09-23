# ==========================================
# Etapa 1: Compilación de la app Vite / React
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias del frontend
COPY app/frontend/package*.json ./

# Instalar dependencias limpias
RUN npm ci

# Variables para Vite en tiempo de compilación (con valores por defecto configurables)
ARG VITE_AZURE_CLIENT_ID=9728c7cb-0135-4fc7-9cb8-4e5c07f361ec
ARG VITE_AZURE_TENANT_ID=856339f4-c0e8-4135-8ec3-2922d5b9def6
ARG VITE_API_URL=https://svprdpbiback.azurewebsites.net

ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_API_URL=$VITE_API_URL

# Copiar el código fuente del frontend
COPY app/frontend ./

# Compilar proyecto para producción
RUN npm run build

# ==========================================
# Etapa 2: Servidor Web Nginx para Producción
# ==========================================
FROM nginx:stable-alpine

# Limpiar archivos HTML por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar los artefactos estáticos generados por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx (soporte SPA y reverse proxy)
COPY app/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 (estándar para Azure App Service en contenedores HTTP)
EXPOSE 80

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
