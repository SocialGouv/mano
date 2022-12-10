# Mano

![Mobile version](https://img.shields.io/badge/mobile%20app%20version-2.28.0-blue)
[![Maintainability](https://api.codeclimate.com/v1/badges/223e4185a3e13f1ef5d0/maintainability)](https://codeclimate.com/github/SocialGouv/mano/maintainability)

Code source de [Mano](https://mano-app.fabrique.social.gouv.fr/), organisé en plusieurs services :

- [Application mobile](https://github.com/SocialGouv/mano/tree/main/app)
- [Interface de gestion](https://github.com/SocialGouv/mano/tree/main/dashboard)
- [API](https://github.com/SocialGouv/mano/tree/main/api)
- [Site](https://github.com/SocialGouv/mano/tree/main/website)

Il est conseillé de lire le fichier `README.md` de chacun de ces services.

## Installation et utilisation

Voir le `README.md` de chacun des services.

## Tests

Les tests sont faits avec [playwright](https://playwright.dev/) (historiquement jest-puppetter).

### Préparation

Pour faire fonctionner les tests en local, installer NodeJS et PostgreSQL et installer l'extension [VSCode Playwright](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) (recommandée).

Mettre dans un `.env` du dossier `mano` l'URL de la base de données:

```
PGBASEURL=postgres://localhost:5432
```

Initialiser la base de données `manotest`:

```bash
# Directement depuis le dossier mano
yarn && yarn test:init-db
```

### Lancer les tests en local

Lancer les tests directement depuis l'interface de VSCode (lancer la commande `Testing: Focus on Playwright View`), qui se charge de lancer les serveurs nécessaires. On peut lancer l'ensemble ou seulement un test.

### Créer des nouveaux tests

Pour aller plus vite à la création de tests, on utilise le recorder de Playwright, lançable directement depuis l'interface de VSCode. Il faut pour l'instant lancer les serveurs à la main, ça devrait être amélioré dans [une prochaine version](https://github.com/microsoft/playwright/issues/18290#issuecomment-1289734778).

```bash
# Directement depuis le dossier mano
yarn test:start-api-for-record
yarn test:start-dashboard-for-record
```

Ensuite lancer la commande `Record new` depuis VSCode. Pour chaque test, on peut utiliser un des 50 admins (idéalement utiliser un admin différent pour chaque test pour éviter les conflits en cas de lancement simultanés de tests).

- Email : `admin1@example.org`, `admin2@example.org`, etc.
- Mot de passe : `secret`
- Secret partagé d'organisation: `plouf`

## Contact

Plus d'information sur Mano ici : https://www.fabrique.social.gouv.fr/startups/mano/

Pour contacter l’équipe : g.demirhan@aurore.asso.fr ou nathan.fradin.mano@gmail.com
