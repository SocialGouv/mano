import React, { useState, useEffect, useRef, useCallback } from 'react';
import { selector, useRecoilState, useRecoilValue } from 'recoil';
import SortableJS from 'sortablejs';
import { useDataLoader } from '../../components/DataLoader';
import ButtonCustom from '../../components/ButtonCustom';
import { organisationState } from '../../recoil/auth';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../../services/api';
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from '../../components/tailwind/Modal';
import { toast } from 'react-toastify';
import { capture } from '../../services/sentry';
import { servicesSelector, flattenedServicesSelector, reportsState, prepareReportForEncryption } from '../../recoil/reports';

const servicesGroupTitlesSelector = selector({
  key: 'servicesGroupTitlesSelector',
  get: ({ get }) => {
    const groupedServices = get(servicesSelector);
    return groupedServices.map((group) => group.groupTitle);
  },
});

const ServicesSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const groupedServices = useRecoilValue(servicesSelector);
  const [addGroupModalVisible, setAddGroupModalVisible] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const { refresh } = useDataLoader();
  const API = useApi();

  const onAddGroup = async (e) => {
    e.preventDefault();
    const { groupTitle } = Object.fromEntries(new FormData(e.target));
    if (!groupTitle) return toast.error('Le titre du groupe de services est obligatoire');
    if (groupedServices.find((group) => group.groupTitle === groupTitle)) return toast.error('Ce groupe existe déjà');
    const res = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { groupedServices: [...groupedServices, { groupTitle, services: [] }] },
    });
    if (res.ok) {
      toast.success('Groupe ajouté', { autoclose: 2000 });
      setOrganisation(res.data);
      setAddGroupModalVisible(false);
      refresh();
    }
    refresh();
  };

  const onDragAndDrop = useCallback(async () => {
    const groupsElements = gridRef.current.querySelectorAll('[data-group]');
    const groups = [...groupsElements].map((group) => group.dataset.group).map((groupTitle) => ({ groupTitle, services: [] }));
    for (const group of groups) {
      const servicesElement = gridRef.current.querySelectorAll(`[data-group="${group.groupTitle}"] [data-service]`);
      group.services = [...servicesElement].map((service) => service.dataset.service);
    }
    /* there is a bug sometimes with the drag and drop, where some services are duplicated or even groups disappear...
      we need to check that drag-n-drop only drag-n-dropped and didn't add/remove anything
    */
    if (groups.length !== groupedServices.length) {
      capture('Drag and drop group error', { extra: { groups, groupedServices } });
      return toast.error('Désolé, une erreur est survenue lors du glisser/déposer', "L'équipe technique a été prévenue. Vous pouvez réessayer");
    }
    if (
      groups.reduce((cats, group) => [...cats, ...group.services], []).length !==
      groupedServices.reduce((cats, group) => [...cats, ...group.services], []).length
    ) {
      capture('Drag and drop services error', { extra: { groups, groupedServices } });
      return toast.error('Désolé, une erreur est survenue lors du glisser/déposer', "L'équipe technique a été prévenue. Vous pouvez réessayer");
    }
    setIsDisabled(true);
    const res = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { groupedServices: groups },
    });
    setIsDisabled(false);
    if (res.ok) {
      setOrganisation(res.data);
      refresh();
    }
  }, [API, groupedServices, organisation._id, refresh, setOrganisation]);

  const gridRef = useRef(null);
  const sortableRef = useRef(null);
  useEffect(() => {
    sortableRef.current = SortableJS.create(gridRef.current, {
      animation: 150,
      group: 'servicesGroups',
      onEnd: onDragAndDrop,
    });
  }, [groupedServices, onDragAndDrop]);

  return (
    <>
      <div className={['tw-my-10 tw-flex tw-items-center tw-gap-2', isDisabled ? 'disable-everything' : ''].join(' ')}>
        <h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Services</h3>
        <ButtonCustom title="Ajouter un groupe" className="tw-ml-auto" onClick={() => setAddGroupModalVisible(true)} />
      </div>
      <div key={JSON.stringify(groupedServices)} className={isDisabled ? 'tw-cursor-wait' : ''}>
        <div
          id="service-groups"
          className={['tw--m-1 tw-inline-flex tw-w-full tw-flex-wrap', isDisabled ? 'disable-everything' : ''].join(' ')}
          ref={gridRef}>
          {groupedServices.map(({ groupTitle, services }) => (
            <ServicesGroup key={groupTitle} groupTitle={groupTitle} services={services} onDragAndDrop={onDragAndDrop} />
          ))}
        </div>
      </div>
      <ModalContainer open={addGroupModalVisible}>
        <ModalHeader title="Ajouter un groupe de services" />
        <ModalBody>
          <form id="add-services-group-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onAddGroup}>
            <div>
              <label htmlFor="groupTitle" className="form-text tailwindui">
                Titre du groupe
              </label>
              <input type="text" id="groupTitle" name="groupTitle" placeholder="Injection" className="form-text tailwindui" />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button name="cancel" type="button" className="button-cancel" onClick={() => setAddGroupModalVisible(false)}>
            Annuler
          </button>
          <button type="submit" className="button-submit" form="add-services-group-form">
            Ajouter
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

const ServicesGroup = ({ groupTitle, services, onDragAndDrop }) => {
  const listRef = useRef(null);
  const sortableRef = useRef(null);
  const [isEditingGroupTitle, setIsEditingGroupTitle] = useState(false);
  const groupTitles = useRecoilValue(servicesGroupTitlesSelector);
  const groupedServices = useRecoilValue(servicesSelector);
  // const reports = useRecoilValue(reportsState);
  const flattenedServices = useRecoilValue(flattenedServicesSelector);

  const API = useApi();
  const { refresh } = useDataLoader();
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  useEffect(() => {
    sortableRef.current = SortableJS.create(listRef.current, {
      animation: 150,
      group: 'services',
      onEnd: onDragAndDrop,
    });
  }, [onDragAndDrop]);

  const onEditGroupTitle = async (e) => {
    e.preventDefault();
    const { newGroupTitle } = Object.fromEntries(new FormData(e.target));
    const oldGroupTitle = groupTitle;
    if (!newGroupTitle) return toast.error('Vous devez saisir un nom pour le groupe');
    if (newGroupTitle.trim() === oldGroupTitle.trim()) return toast.error("Le nom du groupe n'a pas changé");
    if (groupTitles.find((title) => title === newGroupTitle)) return toast.error('Ce groupe existe déjà');

    const newGroupedServices = groupedServices.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        groupTitle: newGroupTitle,
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI

    const response = await API.put({
      path: `/service`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      setIsEditingGroupTitle(false);
      toast.success("Groupe mis à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteGroup = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe et tous ses services ? Cette opération est irréversible')) return;
    const newGroupedServices = groupedServices.filter((group) => group.groupTitle !== groupTitle);

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI

    // TODO
    const response = await API.put({
      path: `/service`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      refresh();
      setIsEditingGroupTitle(false);
      setOrganisation(response.data);
      toast.success("Service supprimée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onAddService = async (e) => {
    e.preventDefault();
    const { newService } = Object.fromEntries(new FormData(e.target));
    if (!newService) return toast.error('Vous devez saisir un nom pour le service');
    if (flattenedServices.includes(newService)) {
      const existingGroupTitle = groupedServices.find(({ services }) => services.includes(newService)).groupTitle;
      return toast.error(`Ce service existe déjà: ${existingGroupTitle} > ${newService}`);
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
      path: `/service`,
      body: {
        groupedServices: newGroupedServices,
      },
    });
    if (response.ok) {
      setOrganisation(response.data);
      toast.success("Service ajouté. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard", { autoClose: 2000 });
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <>
      <div className="tw-min-h-full tw-basis-1/2 tw-p-1 xl:tw-basis-1/3">
        <details
          open
          key={groupTitle}
          id={groupTitle}
          data-group={groupTitle}
          className="service-group tw-flex tw-min-h-full tw-flex-col tw-rounded-2xl tw-bg-main tw-bg-opacity-10 tw-p-4">
          <summary className="tw-basis-full tw-text-sm tw-font-bold tw-tracking-wide tw-text-gray-700">
            <div className="tw-group tw-inline-flex tw-w-11/12 tw-shrink tw-justify-between">
              <span className="service-group-title tw-pl-2">
                {groupTitle} ({services.length})
              </span>
              <button
                type="button"
                aria-label={`Modifier le groupe ${groupTitle}`}
                className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
                onClick={() => setIsEditingGroupTitle(true)}>
                ✏️
              </button>
            </div>
          </summary>
          <div className="tw-mt-4 tw-flex tw-h-full tw-flex-col" ref={listRef}>
            {!services.length ? (
              <p className="tw-m-0 tw-text-xs tw-italic tw-opacity-30">Aucun service dans ce groupe</p>
            ) : (
              services.map((service) => <Service service={service} key={service} groupTitle={groupTitle} />)
            )}
            <form className="tw-mt-4 tw-flex" onSubmit={onAddService}>
              <input
                type="text"
                id="newService"
                name="newService"
                className="form-text tw-my-1  tw-w-full tw-rounded tw-bg-white/50 tw-px-1.5 tw-py-1 placeholder:tw-opacity-80"
                placeholder="Ajouter un service"
              />
              <button type="submit" className="tw-ml-4 tw-rounded tw-bg-transparent hover:tw-underline">
                Ajouter
              </button>
            </form>
          </div>
        </details>
      </div>
      <ModalContainer open={isEditingGroupTitle}>
        <ModalHeader title={`Éditer le groupe: ${groupTitle}`} />
        <ModalBody>
          <form id="edit-service-group-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditGroupTitle}>
            <div>
              <label htmlFor="newGroupTitle" className="form-text tailwindui">
                Nouveau nom du groupe
              </label>
              <input type="text" id="newGroupTitle" name="newGroupTitle" placeholder={groupTitle} className="form-text tailwindui" />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setIsEditingGroupTitle(false)}>
            Annuler
          </button>
          <button type="button" className="button-destructive" onClick={onDeleteGroup}>
            Supprimer
          </button>
          <button type="submit" className="button-submit" form="edit-service-group-form">
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

const Service = ({ service, groupTitle }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const reports = useRecoilValue(reportsState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const API = useApi();
  const groupedServices = useRecoilValue(servicesSelector);
  const flattenedServices = useRecoilValue(flattenedServicesSelector);
  const { refresh } = useDataLoader();

  const onEditService = async (e) => {
    e.preventDefault();
    const { newService } = Object.fromEntries(new FormData(e.target));
    const oldService = service;
    if (!newService) return toast.error('Vous devez saisir un nom pour le service');
    if (newService.trim() === oldService.trim()) return toast.error("Le nom de le service n'a pas changé");
    if (flattenedServices.includes(newService)) {
      const existingGroupTitle = groupedServices.find(({ services }) => services.includes(newService)).groupTitle;
      return toast.error(`Ce service existe déjà: ${existingGroupTitle} > ${newService}`);
    }
    const reportsWithService = reports.filter((r) => Object.keys(JSON.parse(r.services || '{}')).includes(oldService.trim()));
    const encryptedReports = await Promise.all(
      reportsWithService
        .filter((a) => a.services.includes(oldService))
        .map((report) => {
          const newServices = {};
          const oldServices = JSON.parse(report.services || '{}');
          for (const service of Object.keys(oldServices)) {
            if (service === oldService) {
              if (Object.keys(oldServices).includes(newService)) {
                // merge
                if (!newServices[newService]) newServices[newService] = 0;
                newServices[newService] = newServices[newService] + oldServices[newService];
              } else {
                newServices[newService] = oldServices[oldService];
              }
            } else {
              if (!newServices[service]) newServices[service] = 0;
              newServices[service] = newServices[service] + oldServices[service];
            }
          }
          return {
            ...report,
            services: JSON.stringify(newServices),
          };
        })
        .map(prepareReportForEncryption)
        .map(encryptItem(hashedOrgEncryptionKey))
    );
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
      path: `/service`,
      body: {
        groupedServices: newGroupedServices,
        reports: encryptedReports,
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      setIsEditingService(false);
      toast.success("Service mis à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteService = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce service ? Cette opération est irréversible')) return;
    const newGroupedServices = groupedServices.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        services: group.services.filter((cat) => cat !== service),
      };
    });
    /* TODO
    const encryptedActions = await Promise.all(
      reports
        .filter((a) => a.services.includes(service))
        .map((action) => ({
          ...action,
          services: action.services.filter((cat) => cat !== service),
        }))
        .map(prepareReportForEncryption)
        .map(encryptItem(hashedOrgEncryptionKey))
    );
    */
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, groupedServices: newGroupedServices }); // optimistic UI

    const response = await API.put({
      path: `/service`,
      body: {
        groupedServices: newGroupedServices,
        // actions: encryptedActions,
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
          'tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1',
          isSelected ? 'tw-rounded tw-border-main' : '',
        ].join(' ')}>
        <p className="tw-m-0" id={service}>
          {service}
        </p>
        <button
          type="button"
          aria-label={`Modifier le service ${service}`}
          className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
          onClick={() => setIsEditingService(true)}>
          ✏️
        </button>
      </div>
      <ModalContainer open={isEditingService}>
        <ModalHeader title={`Éditer le service: ${service}`} />
        <ModalBody>
          <form id="edit-service-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditService}>
            <div>
              <label htmlFor="newService" className="form-text tailwindui">
                Nouveau nom de le service
              </label>
              <input className="form-text tailwindui" id="newService" name="newService" type="text" placeholder={service} />
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
