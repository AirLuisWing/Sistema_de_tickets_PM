#!/bin/sh

echo "⏳ 1/3 - Sincronizando la estructura de la base de datos (DB Push)..."
npx prisma db push

echo "🌱 2/3 - Inyectando datos iniciales (Seed)..."
npx prisma db seed

echo "🚀 3/3 - Iniciando el sistema de tickets de la Policía Morelia..."
node server.js