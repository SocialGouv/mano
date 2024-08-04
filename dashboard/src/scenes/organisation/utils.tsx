import type { OrganisationInstance } from "../../types/organisation";

type UmapGeoJSON = {
  type: "Feature";
  properties: {
    name: string;
    description: string; //"- La Parenthèse CAARUD\n- UDAUS 80 (Samu Social)\n- La Passerelle (ADJ l'îlot) etc.",
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  id: string; // "AzMzQ"
};

export function getUmapGeoJSONFromOrgs(organisations: Array<OrganisationInstance>): Array<UmapGeoJSON> {
  const geoJSONs: Record<string, UmapGeoJSON> = {};

  for (const organisation of organisations) {
    const city = organisation.city;
    if (!city) continue;
    const [cityAndDepartment, stringifiedCoordinates] = city.split(" - ");
    const coordinates = JSON.parse(stringifiedCoordinates) as [number, number];
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
