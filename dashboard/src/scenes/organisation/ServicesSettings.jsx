import { useState, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useDataLoader } from "../../components/DataLoader";
import { organisationState } from "../../recoil/auth";
import API from "../../services/api";
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import { toast } from "react-toastify";
import { servicesSelector, flattenedServicesSelector } from "../../recoil/reports";
import DragAndDropSettings from "./DragAndDropSettings";

const ServicesSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const groupedServices = useRecoilValue(servicesSelector);
  const dataFormatted = useMemo(() => {
    return groupedServices.map(({ groupTitle, services }) => ({
      groupTitle,
      items: services,
    }));
  }, [groupedServices]);

  const { refresh } = useDataLoader();

  const onAddGroup = async (groupTitle) => {
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: [...groupedServices, { groupTitle, services: [] }] }); // optimistic UI

    const response = await API.put({
      path: `/service/update-configuration`,
      body: {
        groupedServices: [...groupedServices, { groupTitle, services: [] }],
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      toast.success("Groupe créé. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onGroupTitleChange = async (oldGroupTitle, newGroupTitle) => {
    const newGroupedServices = groupedServices.map((group) => {
      if (group.groupTitle !== oldGroupTitle) return group;
      return {
        ...group,
        groupTitle: newGroupTitle,
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI

    const response = await API.put({
      path: `/service/update-configuration`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      toast.success("Groupe mis à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteGroup = async (groupTitle) => {
    const newGroupedServices = groupedServices.filter((group) => group.groupTitle !== groupTitle);

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI

    // We don't delete the actual services to avoid user mistakes
    const response = await API.put({
      path: `/service/update-configuration`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      toast.success("Service supprimé. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDragAndDrop = useCallback(
    async (newGroups) => {
      newGroups = newGroups.map((group) => ({ groupTitle: group.groupTitle, services: group.items }));
      const oldOrganisation = organisation;
      setOrganisation({ ...organisation, groupedServices: newGroups }); // optimistic UI

      const response = await API.put({
        path: `/service/update-configuration`,
        body: {
          groupedServices: newGroups,
        },
      });
      if (response.ok) {
        refresh();
        setOrganisation(response.data);
        toast.success("Le groupe a été déplacé.");
      } else {
        setOrganisation(oldOrganisation);
      }
    },
    [refresh, setOrganisation, organisation]
  );

  return (
    <DragAndDropSettings
      title={<h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Services</h3>}
      data={dataFormatted}
      addButtonCaption="Ajouter un groupe"
      onAddGroup={onAddGroup}
      onGroupTitleChange={onGroupTitleChange}
      dataItemKey={(cat) => cat}
      ItemComponent={Service}
      NewItemComponent={AddService}
      onDeleteGroup={onDeleteGroup}
      onDragAndDrop={onDragAndDrop}
    />
  );
};

const AddService = ({ groupTitle, services, onDragAndDrop }) => {
  const groupedServices = useRecoilValue(servicesSelector);
  // const reports = useRecoilValue(reportsState);
  const flattenedServices = useRecoilValue(flattenedServicesSelector);

  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const onAddService = async (e) => {
    e.preventDefault();
    const { newService } = Object.fromEntries(new FormData(e.target));
    if (!newService) return toast.error("Vous devez saisir un nom pour le service");
    if (flattenedServices.includes(newService)) {
      const existingGroupTitle = groupedServices.find(({ services }) => services.includes(newService)).groupTitle;
      return toast.error(`Ce service existe déjà : ${existingGroupTitle} > ${newService}`);
    }
    const newGroupedServices = groupedServices.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        services: [...new Set([...(group.services || []), newService])],
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI
    const response = await API.put({
      path: `/service/update-configuration`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      setOrganisation(response.data);
      toast.success("Service ajouté. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <form className="tw-mt-4 tw-flex" onSubmit={onAddService}>
      <input
        type="text"
        id="newService"
        name="newService"
        className="form-text tw-my-1 tw-w-full tw-rounded tw-bg-white/50 tw-px-1.5 tw-py-1 placeholder:tw-opacity-80"
        placeholder="Ajouter un service"
      />
      <button type="submit" className="tw-ml-4 tw-break-normal tw-rounded tw-bg-transparent hover:tw-underline">
        Ajouter
      </button>
    </form>
  );
};

const Service = ({ item: service, groupTitle }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const groupedServices = useRecoilValue(servicesSelector);
  const flattenedServices = useRecoilValue(flattenedServicesSelector);
  const { refresh } = useDataLoader();

  const onEditService = async (e) => {
    e.preventDefault();
    const { newService } = Object.fromEntries(new FormData(e.target));
    const oldService = service;
    if (!newService) return toast.error("Vous devez saisir un nom pour le service");
    if (newService.trim() === oldService.trim()) return toast.error("Le nom de le service n'a pas changé");
    if (flattenedServices.includes(newService)) {
      const existingGroupTitle = groupedServices.find(({ services }) => services.includes(newService)).groupTitle;
      return toast.error(`Ce service existe déjà: ${existingGroupTitle} > ${newService}`);
    }
    const newGroupedServices = groupedServices.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        services: [...new Set((group.services || []).map((cat) => (cat === oldService ? newService.trim() : cat)))],
      };
    });
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI

    const response = await API.put({
      path: `/service/update-configuration`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      const renamedServicesResponse = await API.put({
        path: `/service/update-service-name`,
        body: { oldService, newService },
      });

      if (!renamedServicesResponse.ok) {
        toast.error("Erreur lors de la mise à jour du nom du service sur les anciens services");
      }

      refresh();
      setOrganisation(response.data);
      setIsEditingService(false);
      toast.success("Service mis à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteService = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce service ? Cette opération est irréversible")) return;
    const newGroupedServices = groupedServices.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        services: group.services.filter((cat) => cat !== service),
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI

    // We don't delete the actual services to avoid user mistakes
    const response = await API.put({
      path: `/service/update-configuration`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      refresh();
      setIsEditingService(false);
      setOrganisation(response.data);
      toast.success("Service supprimé. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <>
      <div
        key={service}
        data-service={service}
        onMouseDown={() => setIsSelected(true)}
        onMouseUp={() => setIsSelected(false)}
        className={[
          "tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1",
          isSelected ? "tw-rounded tw-border-main" : "",
        ].join(" ")}
      >
        <p className="tw-m-0" id={service}>
          {service}
        </p>
        <button
          type="button"
          aria-label={`Modifier le service ${service}`}
          className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
          onClick={() => setIsEditingService(true)}
        >
          ✏️
        </button>
      </div>
      <ModalContainer open={isEditingService}>
        <ModalHeader title={`Modifier le service: ${service}`} />
        <ModalBody className="tw-py-4">
          <form id="edit-service-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditService}>
            <div>
              <label htmlFor="newService" className="tailwindui">
                Nouveau nom du service
              </label>
              <input className="tailwindui" id="newService" name="newService" type="text" placeholder={service} />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setIsEditingService(false)}>
            Annuler
          </button>
          <button type="button" className="button-destructive" onClick={onDeleteService}>
            Supprimer
          </button>
          <button type="submit" className="button-submit" form="edit-service-form">
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

export default ServicesSettings;
