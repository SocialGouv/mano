FROM node:20-alpine

RUN mkdir /app && chown 1000:1000 /app && chown 1000:1000 /tmp
WORKDIR /app
USER 1000

COPY website/yarn.lock website/.yarnrc.yml ./
COPY --chown=1000:100 website/.yarn .yarn
RUN yarn fetch --immutable

COPY --chown=1000:100 api/. .

ENV NODE_ENV=production

ENTRYPOINT ["yarn", "start"]
