#!/bin/bash

# Chemin du fichier indicateur de déploiement
DEPLOY_FILE="/var/deploy/deploy-in-progress.txt"

# Vérifie si un déploiement est déjà en cours
if [ -f "$DEPLOY_FILE" ]; then
    echo "Un déploiement est déjà en cours."
    exit 1
fi

# Crée le fichier indicateur de déploiement
touch "$DEPLOY_FILE"

# Ajoute les proxy dans l'environnement
export no_proxy=ad.sesan.fr,.gcsidf.local,localhost,127.0.0.1
export https_proxy=http://sesclaprx-vip.grita.fr:3128
export http_proxy=http://sesclaprx-vip.grita.fr:3128

cd /var/mano
git pull

SHA=$(git rev-parse HEAD)

docker compose build --build-arg SHA=$SHA dashboard
docker compose build --build-arg SHA=$SHA api
docker compose build website

docker rollout dashboard
docker rollout api
docker rollout website

# Supprime le fichier indicateur de déploiement
rm "$DEPLOY_FILE"
