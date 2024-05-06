# Mano

![Mobile version](https://img.shields.io/badge/mobile%20app%20version-3.4.0-blue)

Code source de [Mano](https://mano.sesan.fr/), organisé en plusieurs services :

- [Application mobile](https://github.com/mano-sesan/mano/tree/main/app)
- [Interface de gestion](https://github.com/mano-sesan/mano/tree/main/dashboard)
- [API](https://github.com/mano-sesan/mano/tree/main/api)
- [Site](https://github.com/mano-sesan/mano/tree/main/website)

Il est conseillé de lire le fichier `README.md` de chacun de ces services.

## Installation et utilisation

Voir le `README.md` de chacun des services.

## Tests

Les tests sont faits avec [playwright](https://playwright.dev/).

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

Ensuite lancer la commande `Record new` depuis VSCode. Pour chaque test, on peut utiliser un des 12 admins.

- Email : `admin1@example.org`, `admin2@example.org`, etc.
- Mot de passe : `secret`
- Secret partagé d'organisation: `plouf`

## Contact

Plus d'information sur Mano ici : https://www.fabrique.social.gouv.fr/startups/mano/

Pour contacter l’équipe : g.demirhan@aurore.asso.fr
