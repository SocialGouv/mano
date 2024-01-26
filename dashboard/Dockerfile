FROM node:20

WORKDIR /usr/src/app
COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn fetch --immutable

COPY . .

RUN yarn build
EXPOSE 8083
CMD ["yarn", "start"]
