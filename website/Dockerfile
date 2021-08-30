FROM node:12-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

WORKDIR /app

RUN chown node:node /app

COPY package.json .
COPY yarn.lock .

RUN yarn --frozen-lockfile --ignore-engines

COPY . .

ENV NODE_ENV=production

RUN yarn --ignore-engines build-static

FROM ghcr.io/socialgouv/docker/nginx4spa:6.16.0

COPY --from=builder /app/out /usr/share/nginx/html
