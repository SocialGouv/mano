FROM node:20-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

RUN mkdir /app && chown 1000:1000 /app \
  && chown 1000:1000 /tmp && \
  mkdir /home/node/.yarn && chown 1000:1000 /home/node/.yarn

WORKDIR /app
USER 1000

COPY website/yarn.lock website/.yarnrc.yml ./
COPY --chown=1000:1000 website/.yarn .yarn
RUN yarn fetch --immutable

COPY --chown=1000:1000 website/. .

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1 
RUN yarn build-static

FROM ghcr.io/socialgouv/docker/nginx:7.0.1

COPY --from=builder /app/out /usr/share/nginx/html
