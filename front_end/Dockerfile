FROM node:24-alpine
WORKDIR /usr/src/app

COPY front_end/package*.json ./
COPY front_end/tsconfig*.json ./
COPY front_end/vite.config.ts ./
COPY front_end/postcss.config.js ./

RUN npm ci
COPY front_end/. ./

EXPOSE 5173
CMD ["npm", "run", "dev"]
