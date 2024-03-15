import React, { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState } from 'recoil';
import { organisationState } from '../recoil/auth';
import API from '../services/api';
import ButtonCustom from './ButtonCustom';
import SelectCustom from './SelectCustom';
import Table from './table';
import DeleteButtonAndConfirmModal from './DeleteButtonAndConfirmModal';
import TableCustomFieldteamSelector from './TableCustomFieldTeamSelector';
import SelectDraggableAndEditable from './SelectDraggableAndEditable';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import { newCustomField, typeOptions } from '../utils';
import SelectTeamMultiple from './SelectTeamMultiple';

const getValueFromType = (type) => typeOptions.find((opt) => opt.value === type);

const sanitizeFields = (field) => {
  const sanitizedField = {};
  for (const key of Object.keys(field)) {
    if (![undefined, null].includes(field[key])) sanitizedField[key] = field[key];
  }
  return sanitizedField;
};

const TableCustomFields = ({
  data,
  fields,
  customFields,
  mergeData = null,
  extractData = null,
  keyPrefix = null,
  onEditChoice,
  onlyOptionsEditable,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutableData, setMutableData] = useState(fields);
  const [editingField, setEditingField] = useState(null);
  const [isNewField, setIsNewField] = useState(false);

  const [tableKey, setTableKey] = useState(0);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  function onUpdate(fieldToUpdate, fields) {
    setMutableData(mutableData.map((f) => (f.name === fieldToUpdate.name ? { ...f, ...fields } : f)));
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
          disabled={JSON.stringify(mutableData) === JSON.stringify(fields)}
        />
      </div>
      <EditCustomField
        open={!!editingField || isNewField}
        editingField={editingField}
        data={data}
        onDelete={onDelete}
        onEditChoice={({ oldChoice, newChoice, field }) => {
          const updatedFields = mutableData.map((_field) =>
            _field.name !== field.name
              ? _field
              : {
                  ..._field,
                  options: _field.options.map((option) => (option === oldChoice ? newChoice : option)),
                }
          );
          setMutableData(updatedFields);
          setEditingField(null);
          setIsNewField(false);
          onEditChoice({
            oldChoice,
            newChoice,
            field,
            fields: updatedFields,
          });
        }}
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

export const EditCustomField = ({ open, onDelete, data, editingField, onClose, onSaveField, isNewField, onEditChoice, onlyOptionsEditable }) => {
  const [field, setField] = useState(() => editingField || newCustomField());
  const fieldIsUsed = useMemo(() => !isNewField && !!data.find((p) => p[field?.name]), [data, field?.name, isNewField]);
  const bodyRef = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const editedField = {
      ...field,
      name: formData.get('name'),
      label: formData.get('label'),
      type: formData.get('type'),
      showInStats: formData.get('showInStats') === 'on',
      options: formData.getAll('options'),
    };
    onSaveField(editedField);
  };

  const typeIsDisabled = useMemo(() => {
    if (isNewField || !fieldIsUsed) return false;
    // the idea to disable the type is to avoid bugs with existing data if the type is changed.
    // for example, if the type is changed from multi-choice (array) to text (string), or from boolean to text
    // BUT some data is compatible, let's allow it
    if (['boolean', 'multi-choice'].includes(field.type)) return true;
    return false;
  }, [isNewField, fieldIsUsed, field.type]);

  const optionIsDisabled = useCallback(
    (option) => {
      if (typeIsDisabled) return true;
      if (isNewField || !fieldIsUsed) return false;

      if (['number'].includes(field.type)) {
        return !['text', 'number', 'textarea', 'enum'].includes(option.value);
      }
      if (['text', 'textarea', 'enum', 'yes-no'].includes(field.type)) {
        return !['text', 'textarea', 'enum'].includes(option.value);
      }
      if (['date', 'date-with-time', 'duration'].includes(field.type)) {
        return !['date', 'date-with-time', 'duration'].includes(option.value);
      }
      return true;
    },
    [typeIsDisabled, isNewField, fieldIsUsed, field.type]
  );

  return (
    <ModalContainer open={open} onClose={() => onClose(null)} size="3xl">
      <ModalHeader title={!isNewField ? 'Modifier le champ' : 'Créer un nouveau champ'} />
      <ModalBody ref={bodyRef}>
        <form id="custom-field-form" className="tw-flex tw-min-h-[75vh] tw-w-full tw-flex-wrap tw-px-4" onSubmit={onSubmit}>
          <div className="tw-basis-full tw-p-4">
            <input type="hidden" name="name" value={field.name} />
            <label htmlFor="label" className="tailwindui">
              Nom
            </label>
            <input
              className="tailwindui"
              type="text"
              id="label"
              name="label"
              required
              onInvalid={(F) => F.target.setCustomValidity('Le nom est obligatoire')}
              value={field.label}
              disabled={onlyOptionsEditable}
              onChange={(e) => setField({ ...field, label: e.target.value })}
            />
            {onlyOptionsEditable && <input type="hidden" name="label" value={field.label} />}
          </div>
          <div className="tw-basis-1/2 tw-p-4">
            <label htmlFor="type" className="tailwindui">
              Type
            </label>
            <SelectCustom
              inputId="type"
              classNamePrefix="type"
              name="type"
              onMenuScrollToBottom={() => {
                bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
              }}
              isDisabled={typeIsDisabled || onlyOptionsEditable}
              isOptionDisabled={optionIsDisabled}
              options={typeOptions}
              value={getValueFromType(field.type)}
              onChange={(v) => setField({ ...field, type: v.value })}
            />
            {(fieldIsUsed || onlyOptionsEditable) && <input type="hidden" name="type" value={field.type} />}
          </div>
          <div className="tw-basis-1/2 tw-p-4">
            {!!['enum', 'multi-choice'].includes(field.type) && (
              <>
                <label htmlFor="options" className="tailwindui">
                  Choix
                </label>
                <SelectDraggableAndEditable
                  inputId="options"
                  key={JSON.stringify(field)}
                  name="options"
                  classNamePrefix="options"
                  onEditChoice={({ oldChoice, newChoice, options }) => {
                    if (isNewField) {
                      setField({ ...field, options: options.map((v) => v.value).map((option) => (option === oldChoice ? newChoice : option)) });
                      return;
                    }
                    const choiceIsUsed = !!data.find((p) => p[field?.name] && p[field?.name].includes(oldChoice));
                    if (!choiceIsUsed) {
                      setField({ ...field, options: options.map((v) => v.value).map((option) => (option === oldChoice ? newChoice : option)) });
                      return;
                    }
                    if (
                      window.confirm(
                        `Voulez-vous vraiment renommer "${oldChoice}" en "${newChoice}", et mettre à jour tous les éléments qui ont actuellement "${oldChoice}" en "${newChoice}" ? Cette opération est irréversible.`
                      )
                    ) {
                      onEditChoice({ oldChoice, newChoice, field });
                    }
                  }}
                  creatable
                  options={[...(field?.options || [])].sort((c1, c2) => c1?.localeCompare(c2)).map((opt) => ({ value: opt, label: opt }))}
                  value={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                  onChange={(v) => setField({ ...field, options: v.map((v) => v.value) })}
                />
                <div>
                  <label className="tw-text-sm">
                    <input
                      type="checkbox"
                      className="tw-mr-2 tw-mt-2"
                      name="allowCreateOption"
                      id="allowCreateOption"
                      checked={field.allowCreateOption}
                      onChange={(e) => setField({ ...field, allowCreateOption: e.target.checked })}
                    />
                    <span>Autoriser la saisie libre</span>
                  </label>
                </div>
              </>
            )}
          </div>
          <div className="tw-basis-full tw-p-4">
            <label htmlFor="enabledTeams" className="tailwindui">
              Activé pour
            </label>
            <SelectTeamMultiple
              colored
              inputId="enabledTeams"
              classNamePrefix="enabledTeams"
              onChange={(teamIds) => setField({ ...field, enabledTeams: teamIds })}
              value={field.enabled ? [] : field.enabledTeams ?? []}
              isDisabled={field.enabled}
            />
            <div>
              <label className="tw-text-sm">
                <input
                  type="checkbox"
                  className="tw-mr-2 tw-mt-2"
                  name="enabled"
                  id="enabled"
                  checked={field.enabled}
                  disabled={onlyOptionsEditable}
                  onChange={(e) => setField({ ...field, enabled: e.target.checked })}
                />
                <span>Activé pour toute l'organisation</span>
              </label>
            </div>
          </div>
          <div className="tw-basis-full tw-p-4">
            <div>
              <input
                type="checkbox"
                id="showInStats"
                name="showInStats"
                className="tw-mr-2"
                checked={field.showInStats}
                disabled={onlyOptionsEditable}
                onChange={(e) => setField({ ...field, showInStats: e.target.checked })}
              />
              <label htmlFor="showInStats">Voir dans les statistiques</label>
            </div>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            setField(editingField || newCustomField());
            onClose();
          }}>
          Annuler
        </button>
        {!isNewField && !onlyOptionsEditable && (
          <DeleteButtonAndConfirmModal
            title={`Voulez-vous vraiment supprimer le champ ${editingField?.label}`}
            textToConfirm={editingField?.label}
            onConfirm={async () => onDelete(editingField)}>
            <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
              Cette opération est irréversible
              <br />
              et entrainera la suppression définitive de toutes les données enregistrées sous ce champ.
            </span>
          </DeleteButtonAndConfirmModal>
        )}
        <button type="submit" className="button-submit" form="custom-field-form">
          Enregistrer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default TableCustomFields;
