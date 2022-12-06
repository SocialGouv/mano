FROM node:16-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

WORKDIR /app

RUN chown node:node /app

COPY website/package.json .
COPY website/yarn.lock .

RUN yarn --frozen-lockfile --ignore-engines

COPY website/. .

ENV NODE_ENV=production

RUN yarn --ignore-engines build-static

FROM ghcr.io/socialgouv/docker/nginx:7.3.0

COPY --from=builder /app/out /usr/share/nginx/html
