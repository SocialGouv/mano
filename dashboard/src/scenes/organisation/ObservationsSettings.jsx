import React, { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useDataLoader } from "../../components/DataLoader";
import { organisationState } from "../../recoil/auth";
import API, { tryFetchExpectOk } from "../../services/api";
import { toast } from "react-toastify";
import DragAndDropSettings from "./DragAndDropSettings";
import {
  customFieldsObsSelector,
  groupedCustomFieldsObsSelector,
  prepareObsForEncryption,
  territoryObservationsState,
} from "../../recoil/territoryObservations";
import CustomFieldSetting from "../../components/CustomFieldSetting";
import { EditCustomField } from "../../components/TableCustomFields";
import { encryptItem } from "../../services/encryption";
import { errorMessage } from "../../utils";

const sanitizeFields = (field) => {
  const sanitizedField = {};
  for (const key of Object.keys(field)) {
    if (![undefined, null].includes(field[key])) sanitizedField[key] = field[key];
  }
  return sanitizedField;
};

const ObservationsSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const flatCustomFieldsObs = useRecoilValue(customFieldsObsSelector);
  const groupedCustomFieldsObs = useRecoilValue(groupedCustomFieldsObsSelector);

  const dataFormatted = groupedCustomFieldsObs.map((group) => ({
    groupTitle: group.name,
    items: group.fields,
  }));

  const { refresh } = useDataLoader();

  const onAddGroup = async (name) => {
    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: { groupedCustomFieldsObs: [...groupedCustomFieldsObs, { name, fields: [] }] },
      })
    );
    if (!error) {
      toast.success("Groupe ajouté", { autoclose: 2000 });
      setOrganisation(response.data);
    }
    refresh();
  };

  const onGroupTitleChange = async (oldName, newName) => {
    if (!newName) {
      toast.error("Vous devez saisir un nom pour le groupe de champs personnalisés");
      return;
    }
    const newCustomFieldsObs = groupedCustomFieldsObs.map((type) => {
      if (type.name !== oldName) return type;
      return {
        ...type,
        name: newName,
      };
    });

    const oldOrganisation = organisation;
    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: { groupedCustomFieldsObs: newCustomFieldsObs },
      })
    );
    if (!error) {
      refresh();
      setOrganisation(response.data);
      toast.success("Groupe mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
      toast.error("Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !");
    }
  };

  const onDeleteGroup = async (name) => {
    const newCustomFieldsObs = groupedCustomFieldsObs.filter((type) => type.name !== name);

    const oldOrganisation = organisation;

    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: { groupedCustomFieldsObs: newCustomFieldsObs },
      })
    );
    if (!error) {
      toast.success("Groupe d'observations de territoire supprimé", { autoclose: 2000 });
      setOrganisation(response.data);
      refresh();
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDragAndDrop = useCallback(
    async (newCustomFieldsObs) => {
      newCustomFieldsObs = newCustomFieldsObs.map((group) => ({
        name: group.groupTitle,
        fields: group.items.map((customFieldName) => flatCustomFieldsObs.find((f) => f.name === customFieldName)),
      }));
      const [error, response] = await tryFetchExpectOk(async () =>
        API.put({
          path: `/organisation/${organisation._id}`,
          body: { groupedCustomFieldsObs: newCustomFieldsObs },
        })
      );
      if (!error) {
        setOrganisation(response.data);
        refresh();
      }
    },
    [flatCustomFieldsObs, organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title={<h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Observations de territoire</h3>}
      data={dataFormatted}
      dataItemKey={(cat) => cat.name}
      ItemComponent={ObservationCustomField}
      NewItemComponent={AddField}
      onDragAndDrop={onDragAndDrop}
      addButtonCaption="Ajouter un groupe de champs personnalisés"
      onAddGroup={onAddGroup}
      onGroupTitleChange={onGroupTitleChange}
      onDeleteGroup={onDeleteGroup}
    />
  );
};

const AddField = ({ groupTitle: typeName }) => {
  const groupedCustomFieldsObs = useRecoilValue(groupedCustomFieldsObsSelector);
  const flatCustomFieldsObs = useRecoilValue(customFieldsObsSelector);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [isAddingField, setIsAddingField] = useState(false);
  const { refresh } = useDataLoader();

  const onAddField = async (newField) => {
    if (flatCustomFieldsObs.map((e) => e.label).includes(newField.label)) {
      return toast.error(`Ce nom de champ existe déjà dans un autre groupe`);
    }

    const newCustomFieldsObs = groupedCustomFieldsObs.map((type) => {
      if (type.name !== typeName) return type;
      return {
        ...type,
        fields: [...type.fields, newField].map(sanitizeFields),
      };
    });
    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: { groupedCustomFieldsObs: newCustomFieldsObs },
      })
    );
    if (!error) {
      toast.success("Mise à jour !");
      setOrganisation(response.data);
      refresh();
    } else {
      return toast.error(errorMessage(error));
    }

    setIsAddingField(false);
  };

  return (
    <>
      <button
        type="button"
        className="tw-mt-2 tw-block tw-break-normal tw-rounded tw-bg-transparent hover:tw-underline"
        onClick={() => {
          setIsAddingField(true);
        }}
      >
        Ajouter un champ
      </button>
      <EditCustomField
        isNewField
        open={isAddingField}
        onClose={() => {
          setIsAddingField(false);
        }}
        onSaveField={onAddField}
      />
    </>
  );
};

const replaceOldChoiceByNewChoice = (data, oldChoice, newChoice, field) => {
  return data
    .map((item) => {
      if (typeof item[field.name] === "string") {
        if (item[field.name] !== oldChoice) return null;
        return {
          ...item,
          [field.name]: newChoice,
        };
      }
      // if not string, then it's array
      if (!Array.isArray(item[field.name])) return null;
      if (!item[field.name]?.includes(oldChoice)) return null;
      return {
        ...item,
        [field.name]: item[field.name].map((_choice) => (_choice === oldChoice ? newChoice : _choice)),
      };
    })
    .filter(Boolean);
};

const ObservationCustomField = ({ item: customField, groupTitle: typeName }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingField, setIsEditingField] = useState(false);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const observations = useRecoilValue(territoryObservationsState);
  const groupedCustomFieldsObs = useRecoilValue(groupedCustomFieldsObsSelector);

  const { refresh } = useDataLoader();

  const onSaveField = async (editedField) => {
    const newCustomFieldsObs = groupedCustomFieldsObs.map((type) => {
      if (type.name !== typeName) return type;
      return {
        ...type,
        fields: type.fields.map((field) => (field.name !== editedField.name ? field : editedField)).map(sanitizeFields),
      };
    });
    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: { groupedCustomFieldsObs: newCustomFieldsObs },
      })
    );
    if (!error) {
      toast.success("Mise à jour !");
      setOrganisation(response.data);
      refresh();
    } else {
      return toast.error(errorMessage(error));
    }

    setIsEditingField(false);
  };

  const onEditChoice = async ({ oldChoice, newChoice, field }) => {
    const newCustomFieldsObs = groupedCustomFieldsObs.map((type) => {
      if (type.name !== typeName) return type;
      return {
        ...type,
        fields: type.fields.map((_field) =>
          _field.name !== field.name
            ? _field
            : {
                ..._field,
                options: _field.options.map((option) => (option === oldChoice ? newChoice : option)),
              }
        ),
      };
    });
    setIsEditingField(false);
    const updatedObservations = replaceOldChoiceByNewChoice(observations, oldChoice, newChoice, field);

    const newCustomFieldsObsFlat = newCustomFieldsObs.reduce((acc, type) => [...acc, ...type.fields], []);

    const [error, response] = await tryFetchExpectOk(async () =>
      API.post({
        path: "/custom-field",
        body: {
          customFields: {
            groupedCustomFieldsObs: newCustomFieldsObs,
          },
          observations: await Promise.all(updatedObservations.map(prepareObsForEncryption(newCustomFieldsObsFlat)).map(encryptItem)),
        },
      })
    );
    if (!error) {
      toast.success("Choix mis à jour !");
      setOrganisation(response.data);
    } else {
      toast.error(errorMessage(error));
    }
    refresh();
  };

  const onDeleteField = async () => {
    const newCustomFieldsObs = groupedCustomFieldsObs.map((type) => {
      if (type.name !== typeName) return type;
      return {
        ...type,
        fields: type.fields.filter((field) => field.name !== customField.name),
      };
    });
    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: { groupedCustomFieldsObs: newCustomFieldsObs },
      })
    );
    if (!error) {
      toast.success("Mise à jour !");
      setOrganisation(response.data);
      refresh();
    } else {
      return toast.error(errorMessage(error));
    }
    setIsEditingField(false);
  };

  return (
    <>
      <div
        key={customField.name}
        onMouseDown={() => setIsSelected(true)}
        onMouseUp={() => setIsSelected(false)}
        className={[
          "tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1",
          isSelected ? "tw-rounded tw-border-main" : "",
        ].join(" ")}
      >
        <CustomFieldSetting customField={customField} />
        <button
          type="button"
          aria-label={`Modifier le champ ${customField.label}`}
          className="tw-invisible tw-ml-auto tw-inline-flex tw-pl-2 group-hover:tw-visible"
          onClick={() => setIsEditingField(true)}
        >
          ✏️
        </button>
      </div>
      <EditCustomField
        open={isEditingField}
        editingField={customField}
        data={observations}
        onClose={() => {
          setIsEditingField(false);
        }}
        onDelete={onDeleteField}
        onSaveField={onSaveField}
        onEditChoice={onEditChoice}
      />
    </>
  );
};

export default ObservationsSettings;
