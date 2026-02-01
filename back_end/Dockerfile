FROM node:24-alpine

WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer dépendances
RUN npm install

# Copier Prisma schema
COPY prisma ./prisma/

# Générer Prisma Client
RUN npx prisma generate

# Copier le reste de l'application (sans node_modules)
COPY . .

# # Ajouter le fichier de clé de service Firebase
# COPY src/config/serviceAccountKey.json ./src/config/serviceAccountKey.json

EXPOSE 3500

CMD ["npm", "run", "dev"]


