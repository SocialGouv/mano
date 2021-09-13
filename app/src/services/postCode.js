export const getCityFromPostCode = async (postCode) => {
  if (postCode.length !== 5) {
    return {
      ok: false,
      error: 'Le code postal doit être composé de 5 chiffres',
    };
  }
  const response = await fetch(
    `https://datanova.legroupe.laposte.fr/api/records/1.0/search/?dataset=laposte_hexasmal&rows=1&facet=code_postal&refine.code_postal=${postCode}`
  );
  if (!response.ok) {
    return {
      ok: false,
      error: 'Désolé une erreur est survenue',
    };
  }
  const data = await response.json();
  if (data?.records[0]?.fields?.nom_de_la_commune) {
    return {
      ok: true,
      city: data.records[0].fields.nom_de_la_commune,
    };
  }
  return {
    ok: false,
    error: 'Désolé, aucune ville ne correspond',
  };
};
