FROM node:24-alpine
WORKDIR /usr/src/app

COPY back_end/package*.json ./
COPY back_end/prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY back_end/. ./

EXPOSE 3500
CMD ["npm", "run", "dev"]
