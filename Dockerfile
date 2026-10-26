# ==========================================
# Etapa 1: Construcción (Builder)
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copilar dependencias de desarrollo y producción
COPY package*.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación NestJS (genera la carpeta /dist)
RUN npm run build

# ==========================================
# Etapa 2: Producción (Runner)
# ==========================================
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copiar archivos de configuración de paquetes
COPY package*.json ./

# Instalar únicamente las dependencias de producción
RUN npm ci --only=production

# Copiar los artefactos compilados desde la etapa anterior
COPY --from=builder /usr/src/app/dist ./dist

# Google Cloud Run inyecta dinámicamente la variable PORT (por defecto 8080)
ENV PORT=8080
EXPOSE 8080

# Ejecutar la aplicación con un usuario sin privilegios por seguridad
USER node

CMD ["node", "dist/main"]