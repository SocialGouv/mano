FROM node:20-alpine

WORKDIR /app


COPY api/. .

RUN yarn --frozen-lockfile

RUN chown -R node:node /app
RUN chown -R node:node /tmp

USER 1000

ENV NODE_ENV=production

ENTRYPOINT ["yarn", "start"]
