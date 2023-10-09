FROM node:14-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

WORKDIR /app

RUN chown node:node /app

COPY dashboard/package.json .
COPY dashboard/yarn.lock .

RUN yarn --frozen-lockfile

COPY dashboard/. .

ENV NODE_ENV=production

RUN --mount=type=secret,id=sentry_auth_token \
    yarn build; \
    if [ -f "/run/secrets/sentry_auth_token" ]; then \
        export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_auth_token); \
        yarn sentry:sourcemaps; \
    fi


FROM ghcr.io/socialgouv/docker/nginx4spa:7.0.1

COPY --from=builder /app/build /usr/share/nginx/html
