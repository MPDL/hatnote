# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.0.0

FROM node:${NODE_VERSION}-alpine as base
WORKDIR /app
EXPOSE 3000

FROM base as dev
COPY . .
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev && npm run build-dev
USER node
CMD npm run start

FROM base as staging
COPY . .
ENV NODE_ENV production
# removed --omit=dev so that docker can build the project with webpack
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev && npm run build-staging
USER node
CMD npm run start

FROM base as prod
COPY . .
ENV NODE_ENV production
# removed --omit=dev so that docker can build the project with webpack
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev && npm run build-prod
USER node
CMD npm run start