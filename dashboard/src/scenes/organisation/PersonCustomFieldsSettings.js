import React, { useState, useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useDataLoader } from '../../components/DataLoader';
import { organisationState } from '../../recoil/auth';
import API, { encryptItem } from '../../services/api';
import { toast } from 'react-toastify';
import DragAndDropSettings from './DragAndDropSettings';
import { EditCustomField } from '../../components/TableCustomFields';
import CustomFieldSetting from '../../components/CustomFieldSetting';
import { customFieldsPersonsSelector, flattenedCustomFieldsPersonsSelector, personsState, usePreparePersonForEncryption } from '../../recoil/persons';

const sanitizeFields = (field) => {
  const sanitizedField = {};
  for (const key of Object.keys(field)) {
    if (![undefined, null].includes(field[key])) sanitizedField[key] = field[key];
  }
  return sanitizedField;
};

const PersonCustomFieldsSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const dataFormatted = useMemo(() => {
    return customFieldsPersons.map(({ name, fields }) => ({
      groupTitle: name,
      items: fields,
      editable: !['Informations sociales', 'Informations de santé'].includes(name),
    }));
  }, [customFieldsPersons]);

  const { refresh } = useDataLoader();

  const onAddGroup = async (name) => {
    const res = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { customFieldsPersons: [...customFieldsPersons, { name, fields: [] }] },
    });
    if (res.ok) {
      toast.success('Groupe ajouté', { autoclose: 2000 });
      setOrganisation(res.data);
    }
    refresh();
  };

  const onGroupTitleChange = async (oldName, newName) => {
    if (!newName) {
      toast.error('Vous devez saisir un nom pour le groupe de champs personnalisés');
      return;
    }
    const newCustomFieldsPersons = customFieldsPersons.map((type) => {
      if (type.name !== oldName) return type;
      return {
        ...type,
        name: newName,
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, customFieldsPersons: newCustomFieldsPersons }); // optimistic UI
    const response = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { customFieldsPersons: newCustomFieldsPersons },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      toast.success("Groupe mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
      toast.error("Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !");
    }
  };

  const onDeleteGroup = async (name) => {
    const newCustomFieldsPersons = customFieldsPersons.filter((type) => type.name !== name);

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, customFieldsPersons: newCustomFieldsPersons }); // optimistic UI

    const response = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { customFieldsPersons: newCustomFieldsPersons },
    });
    if (response.ok) {
      toast.success('Type de consultation supprimé', { autoclose: 2000 });
      setOrganisation(response.data);
      refresh();
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDragAndDrop = useCallback(
    async (newCustomFieldsPersons) => {
      newCustomFieldsPersons = newCustomFieldsPersons.map((group) => ({
        name: group.groupTitle,
        fields: group.items.map((customFieldName) => flattenedCustomFieldsPersons.find((f) => f.name === customFieldName)),
      }));
      const res = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsPersons: newCustomFieldsPersons },
      });
      if (res.ok) {
        setOrganisation(res.data);
        refresh();
      }
    },
    [flattenedCustomFieldsPersons, organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title={<h4>Champs personnalisés</h4>}
      data={dataFormatted}
      addButtonCaption="Ajouter un groupe de champs personnalisés"
      onAddGroup={onAddGroup}
      onGroupTitleChange={onGroupTitleChange}
      dataItemKey={(cat) => cat.name}
      ItemComponent={ConsultationCustomField}
      NewItemComponent={AddField}
      onDeleteGroup={onDeleteGroup}
      onDragAndDrop={onDragAndDrop}
    />
  );
};

const AddField = ({ groupTitle: typeName }) => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const [isAddingField, setIsAddingField] = useState(false);
  const { refresh } = useDataLoader();

  const onAddField = async (newField) => {
    try {
      const newCustomFieldsPersons = customFieldsPersons.map((type) => {
        if (type.name !== typeName) return type;
        return {
          ...type,
          fields: [...type.fields, newField].map(sanitizeFields),
        };
      });
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsPersons: newCustomFieldsPersons },
      });
      if (response.ok) {
        toast.success('Mise à jour !');
        setOrganisation(response.data);
        refresh();
      }
    } catch (orgUpdateError) {
      console.log('error in updating organisation', orgUpdateError);
      toast.error(orgUpdateError.message);
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
        }}>
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
      if (typeof item[field.name] === 'string') {
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

const ConsultationCustomField = ({ item: customField, groupTitle: typeName }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingField, setIsEditingField] = useState(false);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const allPersons = useRecoilValue(personsState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const preparePersonForEncryption = usePreparePersonForEncryption();

  const { refresh } = useDataLoader();

  const onSaveField = async (editedField) => {
    try {
      const newCustomFieldsPersons = customFieldsPersons.map((type) => {
        if (type.name !== typeName) return type;
        return {
          ...type,
          fields: type.fields.map((field) => (field.name !== editedField.name ? field : editedField)).map(sanitizeFields),
        };
      });
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsPersons: newCustomFieldsPersons },
      });
      if (response.ok) {
        toast.success('Mise à jour !');
        setOrganisation(response.data);
        refresh();
      }
    } catch (orgUpdateError) {
      console.log('error in updating organisation', orgUpdateError);
      toast.error(orgUpdateError.message);
    }
    setIsEditingField(false);
  };

  const onEditChoice = async ({ oldChoice, newChoice, field }) => {
    const newCustomFieldsPersons = customFieldsPersons.map((type) => {
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
    const updatedPersons = replaceOldChoiceByNewChoice(allPersons, oldChoice, newChoice, field);

    const response = await API.post({
      path: '/custom-field',
      body: {
        customFields: {
          customFieldsPersons: newCustomFieldsPersons,
        },
        persons: await Promise.all(updatedPersons.map(preparePersonForEncryption).map(encryptItem)),
      },
    });
    if (response.ok) {
      toast.success('Choix mis à jour !');
      setOrganisation(response.data);
    }
    refresh();
  };

  const onDeleteField = async () => {
    try {
      const newCustomFieldsPersons = customFieldsPersons.map((type) => {
        if (type.name !== typeName) return type;
        return {
          ...type,
          fields: type.fields.filter((field) => field.name !== customField.name),
        };
      });
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsPersons: newCustomFieldsPersons },
      });
      if (response.ok) {
        toast.success('Mise à jour !');
        setOrganisation(response.data);
        refresh();
      }
    } catch (orgUpdateError) {
      console.log('error in updating organisation', orgUpdateError);
      toast.error(orgUpdateError.message);
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
          'tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1',
          isSelected ? 'tw-rounded tw-border-main' : '',
        ].join(' ')}>
        <CustomFieldSetting customField={customField} />
        <button
          type="button"
          aria-label={`Modifier le champ ${customField.label}`}
          className="tw-invisible tw-ml-auto tw-inline-flex tw-pl-2 group-hover:tw-visible"
          onClick={() => setIsEditingField(true)}>
          ✏️
        </button>
      </div>
      <EditCustomField
        open={isEditingField}
        editingField={customField}
        data={allPersons}
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

export default PersonCustomFieldsSettings;
