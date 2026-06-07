FROM node:20-alpine
WORKDIR /app

# OpenSSL — wymagany przez Prisma na Alpine
RUN apk add --no-cache openssl

# Instalacja zaleznosci (pelna, z dev — potrzebne prisma CLI + tsx do seeda)
COPY package.json package-lock.json ./
RUN npm ci

# Kod zrodlowy
COPY . .

# Generowanie klienta Prisma + build Next.js
RUN npx prisma generate
RUN npm run build

# Katalog na uploady
RUN mkdir -p /app/public/uploads

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start: utworz/aktualizuj tabele (db push), zasiej dane (seed, nie blokuj gdy juz sa), uruchom
CMD ["sh", "-c", "npx prisma db push && (npx prisma db seed || true) && npm start"]
