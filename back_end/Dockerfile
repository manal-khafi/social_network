FROM node:24-alpine

# Installer openssl et certificats racine
# RUN apk add --no-cache openssl ca-certificates

WORKDIR /usr/src/app

# Copier package files
COPY package*.json ./
COPY package-lock.json ./

# Copier prisma schema
COPY prisma ./prisma/

# Installer dépendances
RUN npm i

# Générer Prisma client
RUN npx prisma generate

# Copier le reste de l'application
COPY . .

EXPOSE 3500

# Pour dev
CMD ["npm", "run", "dev"]
