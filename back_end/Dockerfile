FROM node:24-alpine

WORKDIR /usr/src/app

# postgresql-client provides pg_isready, used by the entrypoint to wait for the DB
RUN apk add --no-cache postgresql-client

# Install dependencies (dev deps included: ts-node + prisma CLI are needed at runtime).
# Keep NODE_ENV unset here so `npm ci` does not drop devDependencies.
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# App source
COPY . .

# Generate Prisma Client against the bundled schema. prisma.config.ts requires
# DATABASE_URL to be defined even though `generate` never opens a connection, so
# a throwaway value is passed for this build step only.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

# Uploads directory (mounted as a named volume in production) owned by the runtime user
RUN mkdir -p uploads/avatars \
    && chown -R node:node /usr/src/app

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
USER node

EXPOSE 3500

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "serve"]
