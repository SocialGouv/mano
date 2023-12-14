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
    --mount=type=secret,id=react_app_org_duplicated_1_id,uid=1000 \
    --mount=type=secret,id=react_app_org_duplicated_1_name,uid=1000 \
    --mount=type=secret,id=react_app_org_duplicated_2_id,uid=1000 \
    --mount=type=secret,id=react_app_org_duplicated_2_name,uid=1000 \
    --mount=type=secret,id=react_app_org_id_for_truplication,uid=1000 \
    if [ -f "/run/secrets/react_app_org_duplicated_1_id" ]; then \
        export REACT_APP_ORG_DUPLICATED_1_ID=$(cat /run/secrets/react_app_org_duplicated_1_id); \
    fi; \
    if [ -f "/run/secrets/react_app_org_duplicated_1_name" ]; then \
        export REACT_APP_ORG_DUPLICATED_1_NAME=$(cat /run/secrets/react_app_org_duplicated_1_name); \
    fi; \
    if [ -f "/run/secrets/react_app_org_duplicated_2_id" ]; then \
        export REACT_APP_ORG_DUPLICATED_2_ID=$(cat /run/secrets/react_app_org_duplicated_2_id); \
    fi; \
    if [ -f "/run/secrets/react_app_org_duplicated_2_name" ]; then \
        export REACT_APP_ORG_DUPLICATED_2_NAME=$(cat /run/secrets/react_app_org_duplicated_2_name); \
    fi; \
    if [ -f "/run/secrets/react_app_org_id_for_truplication" ]; then \
        export REACT_APP_ORG_ID_FOR_TRUPLICATION=$(cat /run/secrets/react_app_org_id_for_truplication); \
    fi; \
    yarn build; \
    if [ -f "/run/secrets/sentry_auth_token" ]; then \
        export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_auth_token); \
        yarn sentry:sourcemaps; \
    fi


FROM ghcr.io/socialgouv/docker/nginx4spa:7.0.1

COPY --from=builder /app/build /usr/share/nginx/html
