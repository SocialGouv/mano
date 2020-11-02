require("dotenv").config();

const { pg } = require("../src/pg");

const createRelation = async () => {
  const tx = await pg.connect();
  try {
    await tx.query("BEGIN");
    const places = (
      await pg.query(
        `
    SELECT * FROM place
    `
      )
    ).rows;

    await Promise.all(
      places.map((place) =>
        pg.query(
          `INSERT INTO rel__person_place(place_id, person_id)
        VALUES('${place.id}', '${place.person_id}')`
        )
      )
    );
    await tx.query("COMMIT");

    console.log("relation done");
  } catch (e) {
    console.log("relation FAILED");
    console.error(e);
    await tx.query("ROLLBACK");
  } finally {
    tx.release();
  }
};

const mergeDuplicate = async () => {
  const tx = await pg.connect();
  try {
    await tx.query("BEGIN");
    const distinctPlaces = (
      await tx.query(`
    SELECT DISTINCT ON (name) name, id FROM place
  `)
    ).rows;

    for (const place of distinctPlaces) {
      await tx.query(
        `UPDATE rel__person_place SET place_id = $1
      WHERE place_id IN (SELECT id FROM place WHERE name = $2)`,
        [place.id, place.name]
      );
    }

    await tx.query(`DELETE FROM place WHERE NOT(id = ANY( $1 ))`, [distinctPlaces.map((i) => i.id)]);
    await tx.query("COMMIT");
    console.log("merge duplicate done");
  } catch (e) {
    console.log("merge duplicate FAILED");
    console.error(e);
    await tx.query("ROLLBACK");
  } finally {
    tx.release();
  }
};

const main = async () => {
  await createRelation();
  await mergeDuplicate();

  process.exit(0);
};

main();
