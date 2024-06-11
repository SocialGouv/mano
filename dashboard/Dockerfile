FROM node:20

ARG VITE_SCHEME
ARG VITE_HOST
ARG VITE_USE_HTTP
ARG SHA=replaceme

ENV VITE_SCHEME $VITE_SCHEME
ENV VITE_HOST $VITE_HOST
ENV VITE_USE_HTTP $VITE_USE_HTTP
ENV APP_ENV production
ENV NODE_ENV production
ENV SHA $SHA

WORKDIR /usr/src/app
COPY yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
RUN yarn config set httpProxy http://sesclaprx-vip.grita.fr:3128
RUN yarn config set httpsProxy http://sesclaprx-vip.grita.fr:3128
RUN yarn fetch --immutable

COPY . .

RUN yarn build
EXPOSE 8083
CMD ["yarn", "start"]
