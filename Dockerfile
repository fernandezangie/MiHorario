# Stage 1: Build de la aplicación
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de configuración de paquetes
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar NestJS (genera la carpeta /dist)
RUN npm run build

# Stage 2: Imagen de producción ligera
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

# Instalar únicamente dependencias de producción
RUN npm ci --only=production

# Copiar la compilación desde el stage de build
COPY --from=builder /usr/src/app/dist ./dist

# Definir la variable de entorno del puerto
ENV PORT=8080
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]