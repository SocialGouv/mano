FROM node:20

WORKDIR /usr/src/app
COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn config set httpProxy http://sesclaprx-vip.grita.fr:3128
RUN yarn config set httpsProxy http://sesclaprx-vip.grita.fr:3128
RUN yarn fetch --immutable

COPY . .

RUN yarn build
EXPOSE 8080
CMD ["yarn", "start"]
