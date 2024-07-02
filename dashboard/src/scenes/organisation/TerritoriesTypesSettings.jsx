import { useState, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useDataLoader } from "../../components/DataLoader";
import { organisationState, userState } from "../../recoil/auth";
import API, { tryFetchExpectOk } from "../../services/api";
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import { toast } from "react-toastify";
import DragAndDropSettings from "./DragAndDropSettings";
import { encryptTerritory, flattenedTerritoriesTypesSelector, territoriesState, territoriesTypesSelector } from "../../recoil/territory";

const TerritoriesTypesSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const territoriesGroupedTypes = useRecoilValue(territoriesTypesSelector);
  const dataFormatted = useMemo(() => {
    return territoriesGroupedTypes.map(({ groupTitle, types }) => ({
      groupTitle,
      items: types,
    }));
  }, [territoriesGroupedTypes]);

  const { refresh } = useDataLoader();

  const onDragAndDrop = useCallback(
    async (newGroups) => {
      newGroups = newGroups.map((group) => ({ groupTitle: group.groupTitle, types: group.items }));
      const [error, res] = await tryFetchExpectOk(async () =>
        API.put({
          path: `/organisation/${organisation._id}`,
          body: { territoriesGroupedTypes: newGroups },
        })
      );
      if (!error) {
        setOrganisation(res.data);
        refresh();
      }
    },
    [organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title={<h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Types de territoires</h3>}
      data={dataFormatted}
      dataItemKey={(t) => t}
      ItemComponent={TerritoryType}
      NewItemComponent={AddType}
      onDragAndDrop={onDragAndDrop}
    />
  );
};

const AddType = ({ groupTitle }) => {
  const territoriesGroupedTypes = useRecoilValue(territoriesTypesSelector);
  const flattenedTypes = useRecoilValue(flattenedTerritoriesTypesSelector);

  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const onAddType = async (e) => {
    e.preventDefault();
    const { newType } = Object.fromEntries(new FormData(e.target));
    if (!newType) return toast.error("Vous devez saisir un nom pour le type de territoire");
    if (flattenedTypes.includes(newType)) {
      const existingGroupTitle = territoriesGroupedTypes.find(({ types }) => types.includes(newType)).groupTitle;
      return toast.error(`Ce type de territoire existe déjà: ${existingGroupTitle} > ${newType}`);
    }
    const newTerritoriesGroupedTypes = territoriesGroupedTypes.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        types: [...new Set([...(group.types || []), newType])],
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, territoriesGroupedTypes: newTerritoriesGroupedTypes }); // optimistic UI
    const [error, res] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/territory/types`,
        body: {
          territoriesGroupedTypes: newTerritoriesGroupedTypes,
        },
      })
    );
    if (!error) {
      setOrganisation(res.data);
      toast.success("Type de territoire ajouté. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <form className="tw-mt-4 tw-flex tw-break-normal" onSubmit={onAddType}>
      <input
        type="text"
        id="newType"
        name="newType"
        className="form-text tw-my-1  tw-w-full tw-rounded tw-bg-white/50 tw-px-1.5 tw-py-1 placeholder:tw-opacity-80"
        placeholder="Ajouter un type"
      />
      <button type="submit" className="tw-ml-4 tw-rounded tw-bg-transparent hover:tw-underline">
        Ajouter
      </button>
    </form>
  );
};

const TerritoryType = ({ item: type, groupTitle }) => {
  const [isSelected, setIsSelected] = useState(false);
  const user = useRecoilValue(userState);
  const [isEditingType, setIsEditingType] = useState(false);
  const territories = useRecoilValue(territoriesState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const territoriesGroupedTypes = useRecoilValue(territoriesTypesSelector);
  const flattenedTypes = useRecoilValue(flattenedTerritoriesTypesSelector);
  const { refresh } = useDataLoader();

  const onEditType = async (e) => {
    e.preventDefault();
    const { newType } = Object.fromEntries(new FormData(e.target));
    const oldType = type;
    if (!newType) return toast.error("Vous devez saisir un nom pour le type de territoire");
    if (newType.trim() === oldType.trim()) return toast.error("Le nom de le type de territoire n'a pas changé");
    if (flattenedTypes.includes(newType)) {
      const existingGroupTitle = territoriesGroupedTypes.find(({ types }) => types.includes(newType)).groupTitle;
      return toast.error(`Ce type de territoire existe déjà: ${existingGroupTitle} > ${newType}`);
    }
    const encryptedTerritories = await Promise.all(
      territories
        .filter((a) => a.types?.includes(oldType))
        .map((territory) => ({
          ...territory,
          types: [...new Set(territory.types.map((t) => (t === oldType ? newType.trim() : t)))],
        }))
        .map((territory) => encryptTerritory({ ...territory, user: territory.user || user._id }))
    );
    const newTerritoriesGroupedTypes = territoriesGroupedTypes.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        types: [...new Set((group.types || []).map((t) => (t === oldType ? newType.trim() : t)))],
      };
    });
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, territoriesGroupedTypes: newTerritoriesGroupedTypes }); // optimistic UI

    const [error, res] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/territory/types`,
        body: {
          territoriesGroupedTypes: newTerritoriesGroupedTypes,
          territories: encryptedTerritories,
        },
      })
    );
    if (!error) {
      refresh();
      setOrganisation(res.data);
      setIsEditingType(false);
      toast.success("Type de territoires mis à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteType = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce type de territoire ? Cette opération est irréversible")) return;
    const newTerritoriesGroupedTypes = territoriesGroupedTypes.map((group) => {
      if (group.groupTitle !== groupTitle) return group;
      return {
        ...group,
        types: group.types.filter((t) => t !== type),
      };
    });
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, territoriesGroupedTypes: newTerritoriesGroupedTypes }); // optimistic UI

    const [error, res] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/territory/types`,
        body: {
          territoriesGroupedTypes: newTerritoriesGroupedTypes,
        },
      })
    );
    if (!error) {
      refresh();
      setIsEditingType(false);
      setOrganisation(res.data);
      toast.success("Type de territoire supprimé. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <>
      <div
        key={type}
        data-type={type}
        onMouseDown={() => setIsSelected(true)}
        onMouseUp={() => setIsSelected(false)}
        className={[
          "tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1",
          isSelected ? "tw-rounded tw-border-main" : "",
        ].join(" ")}
      >
        <p className="tw-m-0" id={type}>
          {type}
        </p>
        <button
          type="button"
          aria-label={`Modifier le type de territoire ${type}`}
          className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
          onClick={() => setIsEditingType(true)}
        >
          ✏️
        </button>
      </div>
      <ModalContainer open={isEditingType}>
        <ModalHeader title={`Éditer le type de territoire : ${type}`} />
        <ModalBody className="tw-py-4">
          <form id="edit-type-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditType}>
            <div>
              <label htmlFor="newType" className="tailwindui">
                Nouveau nom du type de territoire
              </label>
              <input className="tailwindui" autoComplete="off" id="newType" name="newType" type="text" placeholder={type} />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setIsEditingType(false)}>
            Annuler
          </button>
          <button type="button" className="button-destructive" onClick={onDeleteType}>
            Supprimer
          </button>
          <button type="submit" className="button-submit" form="edit-type-form">
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

export default TerritoriesTypesSettings;
