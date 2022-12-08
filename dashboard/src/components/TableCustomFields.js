import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { selectorFamily, useRecoilState, useRecoilValue } from 'recoil';
import { organisationState } from '../recoil/auth';
import { typeOptions } from '../utils';
import useApi from '../services/api';
import ButtonCustom from './ButtonCustom';
import SelectCustom from './SelectCustom';
import Table from './table';
import DeleteButtonAndConfirmModal from './DeleteButtonAndConfirmModal';
import TableCustomFieldteamSelector from './TableCustomFieldTeamSelector';
import SelectDraggable from './SelectDraggable';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import { personsState } from '../recoil/persons';

const getValueFromType = (type) => typeOptions.find((opt) => opt.value === type);

const sanitizeFields = (field) => {
  const sanitizedField = {};
  for (const key of Object.keys(field)) {
    if (![undefined, null].includes(field[key])) sanitizedField[key] = field[key];
  }
  return sanitizedField;
};

const TableCustomFields = ({ data, customFields, mergeData = null, extractData = null, keyPrefix = null, onlyOptionsEditable }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutableData, setMutableData] = useState(data);
  const [editingField, setEditingField] = useState(null);
  const [isNewField, setIsNewField] = useState(false);

  const [tableKey, setTableKey] = useState(0);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const API = useApi();

  function onUpdate(fieldToUpdate, data) {
    setMutableData(mutableData.map((f) => (f.name === fieldToUpdate.name ? { ...f, ...data } : f)));
  }

  const onShowStatsChange = (fieldToUpdate) => (event) => {
    const showInStats = event.target.checked;
    setMutableData(mutableData.map((field) => (field.name !== fieldToUpdate.name ? field : { ...fieldToUpdate, showInStats })));
  };

  const onSaveField = async (editedField) => {
    const isUpdate = !!mutableData.find((f) => f.name === editedField.name);
    const newData = isUpdate ? mutableData.map((field) => (field.name !== editedField.name ? field : editedField)) : [...mutableData, editedField];
    await handleSubmit(newData);
    setIsNewField(false);
    setEditingField(null);
  };

  const onDelete = (fieldToDelete) => {
    const confirm = window.confirm('Voulez-vous vraiment supprimer ce champ ? Cette opération est irréversible.');
    if (confirm) {
      const dataToSave = mutableData.filter((f) => f).filter((f) => f.name !== fieldToDelete.name);
      setMutableData(dataToSave);
      handleSubmit(dataToSave);
    }
  };

  const handleSubmit = async (newData) => {
    if (!newData) newData = mutableData.filter((field) => !!field.label.length);
    newData = newData.map(sanitizeFields);
    setIsSubmitting(true);
    try {
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { [customFields]: mergeData ? mergeData(newData) : newData },
      });
      if (response.ok) {
        toast.success('Mise à jour !');
        setMutableData(extractData ? extractData(response.data[customFields]) : response.data[customFields]);
        setOrganisation(response.data);
        setTableKey((k) => k + 1);
      }
    } catch (orgUpdateError) {
      console.log('error in updating organisation', orgUpdateError);
      toast.error(orgUpdateError.message);
    }
    setIsSubmitting(false);
  };

  const handleSort = async (keys, oldData) => {
    setIsSubmitting(true);
    try {
      const dataForApi = keys.map((key) => mutableData.find((field) => field.name === key));
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { [customFields]: mergeData ? mergeData(dataForApi) : dataForApi },
      });
      if (response.ok) {
        toast.success('Mise à jour !');
        setMutableData(extractData ? extractData(response.data[customFields]) : response.data[customFields]);
        setOrganisation(response.data);
        setTableKey((k) => k + 1);
      }
    } catch (orgUpdateError) {
      console.log('error in updating organisation', orgUpdateError);
      toast.error(orgUpdateError.message);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Table
        data={mutableData}
        // use this key prop to reset table and reset sortablejs on each element added/removed
        key={(keyPrefix || customFields) + tableKey + organisation}
        rowKey="name"
        dataTestId="label"
        isSortable
        onSort={handleSort}
        noData="Pas de champ personnalisé"
        columns={[
          {
            dataKey: '_id',
            render: (field) => (
              <button
                type="button"
                aria-label="Modifier le champ"
                title="Modifier le champ"
                className="tw-w-8 tw-border-none tw-bg-transparent"
                onClick={() => setEditingField(field)}>
                &#9998;
              </button>
            ),
            small: true,
            show: true,
          },
          {
            title: 'Nom',
            dataKey: 'label',
            render: (f) => (
              <div className="tw-m-auto tw-w-36">
                <span>{f.label}</span>
              </div>
            ),
            show: true,
          },
          {
            title: 'Type',
            dataKey: 'type',
            render: (f) => (
              <div className="tw-m-auto tw-w-36">
                <span>{getValueFromType(f.type)?.label}</span>
              </div>
            ),
            show: true,
          },
          {
            title: 'Options',
            dataKey: 'options',
            render: (f) => (
              <div className="tw-m-auto tw-w-36">{!['enum', 'multi-choice'].includes(f.type) ? null : (f?.options || []).join(', ')}</div>
            ),
            show: true,
          },
          {
            title: "Activé pour l'équipe",
            show: true,
            style: { width: '180px' },
            dataKey: 'enabled',
            render: (f) => <TableCustomFieldteamSelector field={f} onUpdate={(data) => onUpdate(f, data)} />,
          },
          {
            title: (
              <>
                Voir dans les
                <br />
                statistiques
              </>
            ),
            dataKey: 'showInStats',
            render: (f) => <input type="checkbox" checked={f.showInStats} onChange={onShowStatsChange(f)} />,
            show: !onlyOptionsEditable,
          },
          {
            title: '',
            dataKey: 'name',
            small: true,
            show: !onlyOptionsEditable,
            render: (f) => (
              <DeleteButtonAndConfirmModal
                buttonWidth={75}
                title={`Voulez-vous vraiment supprimer le champ ${f.label}`}
                textToConfirm={f.label}
                onConfirm={async () => onDelete(f)}>
                <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
                  Cette opération est irréversible
                  <br />
                  et entrainera la suppression définitive de toutes les données enregistrées sous ce champ.
                </span>
              </DeleteButtonAndConfirmModal>
            ),
          },
          // Remove null fields
        ].filter((col) => !!col.show)}
      />
      <div className="tw-my-10 tw-flex tw-w-full tw-justify-end tw-gap-4">
        {!onlyOptionsEditable && <ButtonCustom title="Ajouter un champ" loading={isSubmitting} onClick={() => setIsNewField(true)} />}
        <ButtonCustom
          title="Mettre à jour"
          loading={isSubmitting}
          onClick={() => handleSubmit()}
          disabled={JSON.stringify(mutableData) === JSON.stringify(data)}
        />
      </div>
      <EditCustomField
        editingField={editingField}
        onlyOptionsEditable={onlyOptionsEditable}
        onClose={() => {
          setEditingField(null);
          setIsNewField(false);
        }}
        onSaveField={onSaveField}
        isNewField={isNewField}
        key={isNewField || editingField?.name}
      />
    </>
  );
};

const newField = () => ({
  // Todo: I guess could use crypto here.
  name: `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`,
  label: '',
  type: 'text',
  enabled: true,
  required: false,
  showInStats: false,
});

const fieldIsUsedSelector = selectorFamily({
  key: 'fieldIsUsedSelector',
  get:
    ({ name }) =>
    ({ get }) => {
      const persons = get(personsState);
      return !!persons.find((p) => p[name]);
    },
});

const EditCustomField = ({ editingField, onClose, onSaveField, isNewField, onlyOptionsEditable }) => {
  const open = Boolean(editingField) || isNewField;
  const [field, setField] = useState(() => editingField || newField());
  const fieldIsUsed = useRecoilValue(fieldIsUsedSelector({ name: field?.name }));

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const editedField = {
      ...field,
      name: formData.get('name'),
      label: formData.get('label'),
      type: formData.get('type'),
      options: formData.getAll('options'),
      showInStats: formData.get('showInStats') === 'on',
      enabled: formData.get('enabled') === 'on',
    };
    onSaveField(editedField);
  };

  return (
    <ModalContainer open={open} onClose={() => onClose(null)} size="3xl">
      <ModalHeader title={!isNewField ? 'Modifier le champ' : 'Créer un nouveau champ'} />
      <ModalBody>
        <form id="custom-field-form" className="tw-flex tw-w-full tw-flex-wrap tw-px-4" onSubmit={onSubmit}>
          <div className="tw-basis-full tw-p-4">
            <input type="hidden" name="name" value={field.name} />
            <label htmlFor="label" className="form-text tailwindui">
              Nom
            </label>
            <input
              className="form-text tailwindui"
              type="text"
              id="label"
              name="label"
              required
              onInvalid={(F) => F.target.setCustomValidity('Le nom est obligatoire')}
              value={field.label}
              disabled={onlyOptionsEditable}
              onChange={(e) => setField({ ...field, label: e.target.value })}
            />
            {/* by default, if an input is disabled, it's not submitted with the form */}
            {/* https://stackoverflow.com/questions/1355728/values-of-disabled-inputs-will-not-be-submitted#answer-1355734 */}
            {onlyOptionsEditable && <input type="hidden" name="label" value={field.label} />}
          </div>
          <div className="tw-basis-1/2 tw-p-4">
            <label htmlFor="type" className="form-text tailwindui">
              Type
            </label>
            <SelectCustom
              inputId="type"
              classNamePrefix="type"
              name="type"
              isDisabled={fieldIsUsed || onlyOptionsEditable}
              options={typeOptions}
              value={getValueFromType(field.type)}
              onChange={(v) => setField({ ...field, type: v.value })}
            />
            {/* if the react-select is disabled, then the native input is not submitted */}
            {/* because by default, if an input is disabled, it's not submitted with the form */}
            {/* https://stackoverflow.com/questions/1355728/values-of-disabled-inputs-will-not-be-submitted#answer-1355734 */}
            {(fieldIsUsed || onlyOptionsEditable) && <input type="hidden" name="type" value={field.type} />}
          </div>
          <div className="tw-basis-1/2 tw-p-4">
            {!!['enum', 'multi-choice'].includes(field.type) && (
              <>
                {' '}
                <label htmlFor="options" className="form-text tailwindui">
                  Choix
                </label>
                <SelectDraggable
                  inputId="options"
                  name="options"
                  classNamePrefix="options"
                  creatable
                  options={[...(editingField?.options || field?.options || [])]
                    .sort((c1, c2) => c1?.localeCompare(c2))
                    .map((opt) => ({ value: opt, label: opt }))}
                  value={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                  onChange={(v) => setField({ ...field, options: v.map((v) => v.value) })}
                />
              </>
            )}
          </div>
          <div className="tw-basis-1/2 tw-p-4">
            <label htmlFor="enabled" className="tw-items-center">
              <input
                id="enabled"
                type="checkbox"
                disabled={onlyOptionsEditable}
                name="enabled"
                className="tw-mr-2"
                checked={field.enabled}
                onChange={(e) => setField({ ...field, enabled: e.target.checked })}
              />
              Activé
            </label>
          </div>
          <div className="tw-basis-1/2 tw-p-4">
            <label htmlFor="showInStats" className="tw-items-center">
              <input
                id="showInStats"
                type="checkbox"
                disabled={onlyOptionsEditable}
                name="showInStats"
                className="tw-mr-2"
                checked={field.showInStats}
                onChange={(e) => setField({ ...field, showInStats: e.target.checked })}
              />
              Voir dans les statistiques
            </label>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="submit" className="button-submit" form="custom-field-form">
          Enregistrer
        </button>
        <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
          Annuler
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default TableCustomFields;
