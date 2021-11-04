FROM node:16-alpine

WORKDIR /app

RUN chown node:node /app

COPY api/. .

RUN yarn --frozen-lockfile

USER node

ENV NODE_ENV=production

ENTRYPOINT ["yarn", "start"]
