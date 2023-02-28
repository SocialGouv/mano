import React, { useState, useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useDataLoader } from '../../components/DataLoader';
import { organisationState } from '../../recoil/auth';
import API, { encryptItem } from '../../services/api';
import { toast } from 'react-toastify';
import DragAndDropSettings from './DragAndDropSettings';
import { consultationsState, prepareConsultationForEncryption } from '../../recoil/consultations';
import { EditCustomField } from '../../components/TableCustomFields';
import CustomFieldSetting from '../../components/CustomFieldSetting';

const sanitizeFields = (field) => {
  const sanitizedField = {};
  for (const key of Object.keys(field)) {
    if (![undefined, null].includes(field[key])) sanitizedField[key] = field[key];
  }
  return sanitizedField;
};

const ConsultationsSettings = () => {
  const allConsultations = useRecoilValue(consultationsState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const consultationFields = organisation.consultations;
  const dataFormatted = useMemo(() => {
    return consultationFields.map(({ name, fields }) => ({
      groupTitle: name,
      items: fields,
    }));
  }, [consultationFields]);

  const { refresh } = useDataLoader();

  const onAddConsultationType = async (name) => {
    const res = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { consultations: [...consultationFields, { name, fields: [] }] },
    });
    if (res.ok) {
      toast.success('Type de consultation ajouté', { autoclose: 2000 });
      setOrganisation(res.data);
    }
    refresh();
  };

  const onConsultationTypeChange = async (oldName, newName) => {
    if (!newName) {
      toast.error('Vous devez saisir un nom pour le type de consultation');
      return;
    }
    const newConsultationFields = consultationFields.map((type) => {
      if (type.name !== oldName) return type;
      return {
        ...type,
        name: newName,
      };
    });

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, consultations: newConsultationFields }); // optimistic UI
    const encryptedConsultations = await Promise.all(
      allConsultations
        .filter((consultation) => consultation.type === oldName)
        .map((consultation) => ({ ...consultation, type: newName }))
        .map(prepareConsultationForEncryption(newConsultationFields))
        .map(encryptItem)
    );
    const response = await API.put({
      path: '/consultation/model',
      body: {
        organisationsConsultations: newConsultationFields,
        consultations: encryptedConsultations,
      },
    });
    if (response.ok) {
      refresh();
      setOrganisation(response.data);
      toast.success("Consultation mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
      toast.error("Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !");
    }
  };

  const onDeleteType = async (name) => {
    const newConsultationFields = consultationFields.filter((type) => type.name !== name);

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, consultations: newConsultationFields }); // optimistic UI

    const response = await API.put({
      path: `/organisation/${organisation._id}`,
      body: { consultations: newConsultationFields },
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
    async (newConsultationFields) => {
      const flattenFields = consultationFields.reduce((allFields, type) => [...allFields, ...type.fields], []);
      newConsultationFields = newConsultationFields.map((group) => ({
        name: group.groupTitle,
        fields: group.items.map((customFieldName) => flattenFields.find((f) => f.name === customFieldName)),
      }));
      console.log({ newConsultationFields, flattenFields });
      const res = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { consultations: newConsultationFields },
      });
      if (res.ok) {
        setOrganisation(res.data);
        refresh();
      }
    },
    [consultationFields, organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title="Consultations"
      data={dataFormatted}
      addButtonCaption="Ajouter un type de consultations"
      onAddGroup={onAddConsultationType}
      onGroupTitleChange={onConsultationTypeChange}
      dataItemKey={(cat) => cat.name}
      ItemComponent={ConsultationCustomField}
      NewItemComponent={AddField}
      onDeleteGroup={onDeleteType}
      onDragAndDrop={onDragAndDrop}
    />
  );
};

const AddField = ({ groupTitle: typeName }) => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const consultationFields = organisation.consultations;
  const [isAddingField, setIsAddingField] = useState(false);
  const { refresh } = useDataLoader();

  const onAddField = async (newField) => {
    try {
      const newConsultationFields = consultationFields.map((type) => {
        if (type.name !== typeName) return type;
        return {
          ...type,
          fields: [...type.fields, newField].map(sanitizeFields),
        };
      });
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { consultations: newConsultationFields },
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
  const allConsultations = useRecoilValue(consultationsState);
  const consultationFields = organisation.consultations;

  const { refresh } = useDataLoader();

  const onSaveField = async (editedField) => {
    try {
      const newConsultationFields = consultationFields.map((type) => {
        if (type.name !== typeName) return type;
        return {
          ...type,
          fields: type.fields.map((field) => (field.name !== editedField.name ? field : editedField)).map(sanitizeFields),
        };
      });
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { consultations: newConsultationFields },
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
    const newConsultationFields = consultationFields.map((type) => {
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
    const updatedConsultations = replaceOldChoiceByNewChoice(allConsultations, oldChoice, newChoice, field);

    const response = await API.post({
      path: '/custom-field',
      body: {
        customFields: {
          consultations: newConsultationFields,
        },
        consultations: await Promise.all(updatedConsultations.map(prepareConsultationForEncryption(newConsultationFields)).map(encryptItem)),
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
      const newConsultationFields = consultationFields.map((type) => {
        if (type.name !== typeName) return type;
        return {
          ...type,
          fields: type.fields.filter((field) => field.name !== customField.name),
        };
      });
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { consultations: newConsultationFields },
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
        data={allConsultations}
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

export default ConsultationsSettings;
