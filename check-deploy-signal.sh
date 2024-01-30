#!/bin/bash

# Chemin vers le fichier signal
SIGNAL_FILE="/var/mano/api/deploy-signal.txt"

# Chemin vers le script de déploiement
DEPLOY_SCRIPT="/var/mano/deploy.sh"

# Vérifie si le signal de déploiement est présent
if [ -f "$SIGNAL_FILE" ]; then
    # Supprime le fichier signal avant de commencer le déploiement
    rm "$SIGNAL_FILE"
    # Exécute le script de déploiement
    bash "$DEPLOY_SCRIPT"
fi
