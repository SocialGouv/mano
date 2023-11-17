Pour ajouter une migration, faites

```bash
npx sequelize-cli migration:generate --name mon-fichier
```

Puis modifiez le fichier créé dans `api/src/db/migrations/` pour ajouter les instructions SQL nécessaires.

Par exemple

```
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "mano"."User"
      ADD COLUMN IF NOT EXISTS "phone" text;
  `);
  },

  async down() {
    // Qui fait des down, et pourquoi ?
  },
};
```
