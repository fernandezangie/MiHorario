# Stage 1: Build de la aplicación
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Usar npm install para garantizar la instalación completa de dependencias
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Imagen de producción ligera
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

# Usar --omit=dev (sintaxis moderna para excluir devDependencies)
RUN npm install --omit=dev

# Copiar la carpeta compilada dist
COPY --from=builder /usr/src/app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start:prod"]