FROM node:20-alpine as builder

RUN apk add --no-cache gcc autoconf automake build-base libpng-dev nasm

RUN mkdir /app && chown 1000:1000 /app \
    && chown 1000:1000 /tmp && \
    mkdir /home/node/.yarn && chown 1000:1000 /home/node/.yarn
WORKDIR /app
USER 1000

COPY dashboard/yarn.lock dashboard/.yarnrc.yml ./
COPY --chown=1000:1000 dashboard/.yarn .yarn
RUN yarn fetch --immutable

COPY --chown=1000:1000 dashboard/. .

ENV NODE_ENV=production

RUN --mount=type=secret,id=sentry_auth_token,uid=1000 \
    --mount=type=secret,id=react_app_org_id_for_migration,uid=1000 \
    --mount=type=secret,id=react_app_team_1,uid=1000 \
    --mount=type=secret,id=react_app_team_2,uid=1000 \
    yarn build; \
    if [ -f "/run/secrets/sentry_auth_token" ]; then \
        export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_auth_token); \
        yarn sentry:sourcemaps; \
    fi; \
    if [ -f "/run/secrets/react_app_org_id_for_migration" ]; then \
        export REACT_APP_ORG_ID_FOR_MIGRATION=$(cat /run/secrets/react_app_org_id_for_migration); \
    fi; \
    if [ -f "/run/secrets/react_app_team_1" ]; then \
        export REACT_APP_TEAM_1=$(cat /run/secrets/react_app_team_1); \
    fi; \
    if [ -f "/run/secrets/react_app_team_2" ]; then \
        export REACT_APP_TEAM_2=$(cat /run/secrets/react_app_team_2); \
    fi


FROM ghcr.io/socialgouv/docker/nginx4spa:7.0.1

COPY --from=builder /app/build /usr/share/nginx/html
