FROM node:20

WORKDIR /usr/src/app
COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn fetch --immutable

COPY . .

EXPOSE 3000
CMD ["yarn", "start"]
