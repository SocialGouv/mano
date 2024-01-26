# Vérifie si un déploiement est déjà en cours
if pgrep -x "deploy.sh" > /dev/null; then
    echo "Un déploiement est déjà en cours."
    exit 1
fi

cd /var/opt/mano/test-claranet
git pull

docker compose build dashboard
docker compose build api
docker compose build website

docker rollout dashboard
docker rollout api
docker rollout website
