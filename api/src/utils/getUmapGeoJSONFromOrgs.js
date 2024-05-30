// source: ./dashboard/src/scenes/organisation/utils.tsx

function getUmapGeoJSONFromOrgs(organisations) {
  const geoJSONs = {};

  for (const organisation of organisations) {
    const city = organisation.city;
    if (!city) continue;
    const [cityAndDepartment, stringifiedCoordinates] = city.split(" - ");
    if (!stringifiedCoordinates) continue;
    const coordinates = JSON.parse(stringifiedCoordinates);
    if (!geoJSONs[cityAndDepartment]) {
      geoJSONs[cityAndDepartment] = {
        type: "Feature",
        properties: {
          name: cityAndDepartment,
          description: "- " + organisation.orgId,
        },
        geometry: {
          type: "Point",
          coordinates,
        },
        id: cityAndDepartment,
      };
    } else {
      geoJSONs[cityAndDepartment].properties.description += `\n- ${organisation.name}`;
    }
  }

  return Object.values(geoJSONs);
}

module.exports = { getUmapGeoJSONFromOrgs };
