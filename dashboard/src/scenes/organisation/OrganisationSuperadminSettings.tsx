import { useState } from "react";
import API from "../../services/api";
import { OrganisationInstance } from "../../types/organisation";
import { ModalContainer, ModalBody, ModalHeader, ModalFooter } from "../../components/tailwind/Modal";
import { toast } from "react-toastify";
import CitySelect from "../../components/CitySelect";

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
                <CitySelect
                  name="city"
                  id="organisation-city"
                  value={data.city}
                  onChange={(nextCity) => {
                    setData({ ...data, city: nextCity });
                  }}
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
