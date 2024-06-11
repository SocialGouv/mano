FROM node:20

ARG SHA=replaceme

ENV SHA $SHA

WORKDIR /usr/src/app
COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn config set httpProxy http://sesclaprx-vip.grita.fr:3128
RUN yarn config set httpsProxy http://sesclaprx-vip.grita.fr:3128
RUN yarn fetch --immutable

COPY . .

EXPOSE 3000
CMD ["yarn", "start"]
