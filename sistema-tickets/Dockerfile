# 1. Etapa de construcción
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma y compilar Next.js
RUN npx prisma generate
RUN npm run build

# 2. Etapa de Producción (Contenedor final ultra ligero)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 4001
EXPOSE 4001

# Copiar archivos esenciales desde el builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docker-entrypoint.sh ./

# Dar permisos de ejecución al script
RUN chmod +x docker-entrypoint.sh

# 🛡️ BLINDAJE CONTRA WINDOWS: Convertir saltos de línea (CRLF a LF)
RUN apk add --no-cache dos2unix
RUN dos2unix docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Arrancar usando nuestro script
CMD ["./docker-entrypoint.sh"]