# Application mobile mano

## Comment livrer une version mobile pour android

Cette procédure est temporaire et sera améliorée.

1. Lancer `yarn update-mobile-app-version`
2. Lancer `yarn build:android-apk`
3. Envoyer le fichier `app/android/app/build/outputs/apk/release/app-release.apk` sur le serveur FTP (obtenir les accès auprès des devs actuels).
4. Committer et push les modifications de version.

## Installer l'environnement de test

Suivre les instructions de Detox, et tâtonner avec les Java et autre `ANDROID_HOME`...
-> https://wix.github.io/Detox/docs/introduction/getting-started/
-> https://wix.github.io/Detox/docs/introduction/android-dev-env
