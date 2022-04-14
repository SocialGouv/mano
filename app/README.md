# Application mobile mano

## Comment livrer une version mobile pour android

Cette procédure est temporaire, a été améliorée mais pour être automatisée.

1. Lancer `yarn update-mobile-app-version [patch|minor|major]`
2. Lancer `yarn build:android-apk`
3. Lancer `yarn publish-release-to-github`
4. Committer et push les modifications de version.

## Installer l'environnement de test

Suivre les instructions de Detox, et tâtonner avec les Java et autre `ANDROID_HOME`...
-> https://wix.github.io/Detox/docs/introduction/getting-started/
-> https://wix.github.io/Detox/docs/introduction/android-dev-env
