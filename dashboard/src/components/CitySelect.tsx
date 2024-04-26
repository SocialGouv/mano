import { theme } from "../config";
import AsyncSelect from "react-select/async";

type GeoApiResponse = {
  codeDepartement: string;
  centre: {
    type: string;
    coordinates: [number, number];
  };
  nom: string;
  code: string;
  _score: number;
};

type City = string;

export default function CitySelect({ name, id, value, onChange }: { value: City; onChange: (value: City) => void; name: string; id: string }) {
  async function loadOptions(inputValue: string) {
    const response: Array<GeoApiResponse> = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${inputValue}&fields=codeDepartement,centre&boost=population&limit=5`
    ).then((res) => res.json());
    console.log({ response });
    const options = response.map((city) => {
      const cityAndDepartment = `${city.nom} (${city.codeDepartement})`;
      return { value: `${cityAndDepartment} - ${JSON.stringify(city.centre.coordinates)}`, label: cityAndDepartment };
    });
    return options;
  }

  return (
    <AsyncSelect
      styles={filterStyles}
      placeholder="Choisir..."
      noOptionsMessage={() => "Aucun résultat"}
      theme={setTheme}
      name={name}
      instanceId={id}
      inputId={id}
      classNamePrefix={id}
      value={{ value: value, label: value?.split?.(" - ")[0] }}
      onChange={(e) => onChange(e?.value)}
      loadOptions={loadOptions}
    />
  );
}

const filterStyles = {
  // control: (styles) => ({ ...styles, borderWidth: 0 }),
  indicatorSeparator: (styles: any) => ({ ...styles, borderWidth: 0, backgroundColor: "transparent" }),
  menuPortal: (provided: any) => ({ ...provided, zIndex: 10000 }),
  menu: (provided: any) => ({ ...provided, zIndex: 10000 }),
};

function setTheme(defaultTheme) {
  return {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      primary: theme.main,
      primary25: theme.main25,
      primary50: theme.main50,
      primary75: theme.main75,
    },
  };
}
