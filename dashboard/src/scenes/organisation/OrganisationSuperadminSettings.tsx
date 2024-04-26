import { useState } from "react";
import API from "../../services/api";
import { theme } from "../../config";
import { OrganisationInstance } from "../../types/organisation";
import { ModalContainer, ModalBody, ModalHeader, ModalFooter } from "../../components/tailwind/Modal";
import { toast } from "react-toastify";
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

export default function OrganisationSuperadminSettings({
  organisation,
  setOpen,
  open,
  updateOrganisation,
}: {
  organisation: OrganisationInstance;
  setOpen: (open: boolean) => void;
  open: boolean;
  updateOrganisation: (organisation: OrganisationInstance) => void;
}) {
  const [data, setData] = useState(organisation);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setData({ ...data, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    API.put({ path: `/organisation/superadmin/${organisation._id}`, body: data }).then((res) => {
      if (res.ok) {
        toast.success("Organisation mise à jour");
        setOpen(false);
        updateOrganisation(res.data);
      } else {
        toast.error("Erreur lors de la mise à jour de l'organisation");
      }
    });
  }

  function onClose() {
    setOpen(false);
  }

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
    <ModalContainer open={open} onClose={onClose} size="3xl">
      <ModalHeader title={`Organisation ${organisation?.name}`} key={organisation?._id} onClose={onClose} />
      <ModalBody className="tw-px-4 tw-py-2 tw-pb-20">
        {data?._id && (
          <form id="organisation-settings" onSubmit={handleSubmit} className="-tw-mx-4 tw-flex tw-flex-row tw-flex-wrap tw-pb-40">
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <div className="tw-mb-4">
                <label htmlFor="orgName">Nom</label>
                <input className="tailwindui" disabled name="name" id="name" defaultValue={data.name} />
              </div>
            </div>
            <div className="tw-flex tw-basis-1/2 tw-flex-col tw-px-4 tw-py-2">
              <div className="tw-mb-4">
                <label htmlFor="orgName" aria-disabled={true}>
                  Identifiant interne <small>(non modifiable)</small>
                </label>
                <input className="tailwindui" disabled name="orgId" id="orgId" defaultValue={data.orgId} />
              </div>
            </div>

            <div className="tw-flex tw-basis-full tw-flex-col tw-px-4 tw-py-2">
              <div className="tw-mb-4">
                <label htmlFor="city">Ville</label>
                <AsyncSelect
                  styles={filterStyles}
                  placeholder="Choisir..."
                  noOptionsMessage={() => "Aucun résultat"}
                  theme={setTheme}
                  instanceId="organisation-city"
                  inputId="organisation-city"
                  value={{ value: data.city, label: data?.city?.split?.(" - ")[0] }}
                  onChange={(e) => {
                    setData({ ...data, city: e?.value });
                  }}
                  classNamePrefix="organisation-city"
                  loadOptions={loadOptions}
                />
              </div>
            </div>
          </form>
        )}
      </ModalBody>
      <ModalFooter>
        <button className="button-cancel" onClick={onClose}>
          Fermer
        </button>
        <button form="organisation-settings" className="button-submit">
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
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
