FROM node:16-alpine

WORKDIR /app


COPY api/. .

RUN yarn --frozen-lockfile

RUN chown -R node:node /app

USER 1000

ENV NODE_ENV=production

ENTRYPOINT ["yarn", "start"]
