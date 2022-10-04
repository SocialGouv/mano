ARG SENTRY_AUTH_TOKEN
FROM node:14-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

WORKDIR /app

RUN chown node:node /app

COPY dashboard/package.json .
COPY dashboard/yarn.lock .

RUN yarn --frozen-lockfile

COPY dashboard/. .

ENV NODE_ENV=production
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=incubateur
ENV SENTRY_URL=https://sentry.fabrique.social.gouv.fr/
ENV SENTRY_PROJECT=mano

RUN yarn build && node scripts/sentry.js

FROM ghcr.io/socialgouv/docker/nginx4spa:7.0.1

COPY --from=builder /app/build /usr/share/nginx/html
