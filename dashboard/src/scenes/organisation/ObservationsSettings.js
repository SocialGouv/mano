import React, { useState, useCallback, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useDataLoader } from '../../components/DataLoader';
import { organisationState } from '../../recoil/auth';
import API, { encryptItem } from '../../services/api';
import { toast } from 'react-toastify';
import DragAndDropSettings from './DragAndDropSettings';
import { customFieldsObsSelector, prepareObsForEncryption, territoryObservationsState } from '../../recoil/territoryObservations';
import CustomFieldSetting from '../../components/CustomFieldSetting';
import { EditCustomField } from '../../components/TableCustomFields';

const sanitizeFields = (field) => {
  const sanitizedField = {};
  for (const key of Object.keys(field)) {
    if (![undefined, null].includes(field[key])) sanitizedField[key] = field[key];
  }
  return sanitizedField;
};

const ObservationsSettings = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const dataFormatted = useMemo(() => {
    return [
      {
        groupTitle: 'Observations de territoire',
        items: customFieldsObs,
      },
    ];
  }, [customFieldsObs]);

  const { refresh } = useDataLoader();

  const onDragAndDrop = useCallback(
    async ([{ items }]) => {
      const reorderedCustomFields = items.map((fieldName, index) => customFieldsObs.find((field) => field.name === fieldName)).map(sanitizeFields);

      try {
        const response = await API.put({
          path: `/organisation/${organisation._id}`,
          body: { customFieldsObs: reorderedCustomFields },
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
    },
    [customFieldsObs, organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title="Observations de territoire"
      data={dataFormatted}
      dataItemKey={(cat) => cat.name}
      ItemComponent={ObservationCustomField}
      NewItemComponent={AddField}
      onDragAndDrop={onDragAndDrop}
    />
  );
};

const AddField = () => {
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [isAddingField, setIsAddingField] = useState(false);
  const { refresh } = useDataLoader();

  const onAddField = async (newField) => {
    try {
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsObs: [...customFieldsObs, newField] },
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
        Ajouter un nouveau champ
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

const ObservationCustomField = ({ item: customField }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingField, setIsEditingField] = useState(false);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const observations = useRecoilValue(territoryObservationsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

  const { refresh } = useDataLoader();

  const onSaveField = async (editedField) => {
    try {
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsObs: customFieldsObs.map((field) => (field.name !== editedField.name ? field : editedField)) },
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

  const onEditChoice = async ({ oldChoice, newChoice, field, fields }) => {
    const updatedFields = customFieldsObs.map((_field) =>
      _field.name !== field.name
        ? _field
        : {
            ..._field,
            options: _field.options.map((option) => (option === oldChoice ? newChoice : option)),
          }
    );
    setIsEditingField(false);
    const updatedObservations = replaceOldChoiceByNewChoice(observations, oldChoice, newChoice, field);

    const response = await API.post({
      path: '/custom-field',
      body: {
        customFields: {
          customFieldsObs: updatedFields,
        },
        observations: await Promise.all(updatedObservations.map(prepareObsForEncryption(updatedFields)).map(encryptItem)),
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
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { customFieldsObs: customFieldsObs.filter((field) => field.name !== customField.name) },
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
          aria-label={`Éditer le champ ${customField.label}`}
          className="tw-invisible tw-ml-auto tw-inline-flex tw-pl-2 group-hover:tw-visible"
          onClick={() => setIsEditingField(true)}>
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
