# Stage 1: Build de la aplicación
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Resolver dependencias ignorando conflictos estrictos de peer dependencies
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Stage 2: Imagen de producción ligera
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /usr/src/app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start:prod"]