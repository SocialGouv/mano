FROM node:20-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

RUN mkdir /app && chown 1000:1000 /app && chown 1000:1000 /tmp
WORKDIR /app
USER 1000

COPY yarn.lock .yarnrc.yml ./
COPY --chown=1000:100 .yarn .yarn
RUN yarn fetch --immutable

COPY website/. .

ENV NODE_ENV=production

RUN yarn --ignore-engines build-static

FROM ghcr.io/socialgouv/docker/nginx:7.0.1

COPY --from=builder /app/out /usr/share/nginx/html
