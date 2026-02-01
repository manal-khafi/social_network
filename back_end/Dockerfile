FROM node:24-alpine

WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Copier Prisma avant npm install
COPY prisma ./prisma/

# Installer dépendances
RUN npm install

# Générer Prisma Client
RUN npx prisma generate

# Copier le reste de l'application
COPY . .

# Expose le port
EXPOSE 3500

# Lancer Prisma Migrate puis le serveur Node
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
