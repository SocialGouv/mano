# Application mobile mano

## Comment livrer une version mobile pour android

Cette procédure est temporaire et sera améliorée.

1. Lancer `yarn update-mobile-app-version`
2. Lancer `yarn build:android-apk`
3. Envoyer le fichier `app/android/app/build/outputs/apk/release/app-release.apk` sur le serveur FTP (obtenir les accès auprès des devs actuels).
4. Committer et push les modifications de version.
