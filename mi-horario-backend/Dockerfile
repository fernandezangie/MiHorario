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
COPY --from=builder /usr/src/app/tsconfig.json ./tsconfig.json
RUN ln -s /usr/src/app/dist /usr/src/app/src

# Cambiado a 3000 para alinearlo con docker-compose.yml
ENV PORT=3000
EXPOSE 3000

# Inicia directamente el proceso con Node en lugar de npm
CMD ["node", "dist/main.js"]