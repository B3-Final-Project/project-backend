FROM node:20.13.1-bullseye-slim AS base

WORKDIR /usr/src/app
COPY . ./

RUN apt-get update && \
  npm install -g npm@10

RUN npm ci
RUN npm run build

# Development stage
FROM node:20.13.1-bullseye-slim AS dev

WORKDIR /usr/src/app
ENV NODE_ENV=development

RUN apt-get update && apt-get install -y curl procps && apt-get clean

COPY --from=base /usr/src/app/ ./

CMD npm run start:debug

# Production stage
FROM node:20.13.1-bullseye-slim AS prod

WORKDIR /usr/src/app

COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/package*.json ./

EXPOSE 8080

RUN apt-get update && \
  apt-get install -y curl && \
  apt-get clean && \
  npm prune --omit="dev"

CMD ["node", "dist/main.js"]
