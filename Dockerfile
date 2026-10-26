# Stage 1: Build de la aplicación
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Imagen de producción ligera
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

ENV PORT=8080
EXPOSE 8080

# Usar la ruta correcta generada por la compilación de NestJS
CMD ["node", "dist/src/main"]