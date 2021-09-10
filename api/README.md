# mano-api

## How to get an anonymous dump - BEFORE EVERYTHING IS ENCRYPTED

-> Connect via SSH in your terminal: `ssh -NL {SSHPORT}:{PGHOST}:{PGPORT} {SSH_USER}@{SSH_IP} -v`

-> Run in another terminal window `npx pg-anonymizer postgresql://{PGUSER}:{PGPASSWORD}@127.0.0.1:{SSHPORT}/{PGDATABASE} -o dump.psql --list=email,name,description,addresse:faker.address.streetAddress,city,country,phone,comment,birthdate`

-> Add your DB to your local environnement by

- running in your terminal `psql`
- then in the postgres bash/shell type `create database mano_dump;`. DON'T FORGET THE `;` !!!
- Once it's done, you can exit with `\q`

-> Finally, restore the anonymized data with `psql -d mano_dump < dump.psql`

## Env variables

| name       | default     |
| ---------- | ----------- |
| NODE_ENV   | development |
| PGDATABASE | -           |
| PGHOST     | -           |
| PGPASSWORD | -           |
| PGUSER     | -           |
| PORT       | 3000        |
| SECRET     | -           |
| SENTRY_KEY | -           |

### Place

Lieux frequentés. Many to Many relationship

### Structure

Structure de suivi de l'usager. Many to Many relationship

```

```

```

```

```

```
