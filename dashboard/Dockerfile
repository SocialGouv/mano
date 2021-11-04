FROM node:14-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

WORKDIR /app

RUN chown node:node /app

COPY dashboard/package.json .
COPY dashboard/yarn.lock .

RUN yarn --frozen-lockfile

COPY dashboard/. .

ENV NODE_ENV=production

RUN yarn build

FROM ghcr.io/socialgouv/docker/nginx4spa:6.16.0

COPY --from=builder /app/build /usr/share/nginx/html
