import { Formik } from 'formik';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState } from 'recoil';
import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import styled from 'styled-components';
import { organisationState, teamsState } from '../recoil/auth';
import { typeOptions } from '../utils';
import useApi from '../services/api';
import ButtonCustom from './ButtonCustom';
import SelectCustom from './SelectCustom';
import Table from './table';
import DeleteButtonAndConfirmModal from './DeleteButtonAndConfirmModal';

const newField = () => ({
  // Todo: I guess could use crypto here.
  name: `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`,
  label: '',
  type: 'text',
  enabled: true,
  required: false,
  showInStats: false,
});

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
  const [isNewField, setIsNewField] = useState(null);
  const [teams, setTeams] = useRecoilState(teamsState);
  const [tableKey, setTableKey] = useState(0);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const API = useApi();

  const onEnabledChange = (fieldToUpdate) => (event) => {
    const enabled = event.target.checked;
    setMutableData(mutableData.map((field) => (field.name !== fieldToUpdate.name ? field : { ...fieldToUpdate, enabled })));
  };

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

  const handleSort = async (keys) => {
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
        isSortable
        onSort={handleSort}
        noData="Pas de champs personnalisés"
        columns={[
          {
            dataKey: '_id',
            render: (field) => <EditButton onClick={() => setEditingField(field)}>&#9998;</EditButton>,
            small: true,
            show: true,
          },
          {
            title: 'Nom',
            dataKey: 'label',
            render: (f) => (
              <CellWrapper>
                <span>{f.label}</span>
              </CellWrapper>
            ),
            show: true,
          },
          {
            title: 'Type',
            dataKey: 'type',
            render: (f) => (
              <CellWrapper>
                <span>{getValueFromType(f.type).label}</span>
              </CellWrapper>
            ),
            show: true,
          },
          {
            title: 'Options',
            dataKey: 'options',
            render: (f) => <CellWrapper>{!['enum', 'multi-choice'].includes(f.type) ? null : (f?.options || []).join(', ')}</CellWrapper>,
            show: true,
          },
          {
            title: "Activé pour l'équipe",
            show: true,
            dataKey: 'enabled',
            render: (f) => {
              return (
                <div className="text-left">
                  <div>
                    <label>
                      <input type="checkbox" checked={f.enabled === true || f.enabled === '__ALL__'} onChange={onEnabledChange(f, '__ALL__')} />
                      <b>Toute l'organisation</b>
                    </label>
                  </div>
                  {teams.map((e) => {
                    return (
                      <div>
                        <label>
                          <input type="checkbox" checked={f.enabled} onChange={onEnabledChange(f, e.id)} />
                          {e.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              );
            },
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
      <ButtonsWrapper>
        {!onlyOptionsEditable && <ButtonCustom title="Ajouter un champ" loading={isSubmitting} onClick={() => setIsNewField(true)} />}
        <ButtonCustom
          title="Mettre à jour"
          loading={isSubmitting}
          onClick={() => handleSubmit()}
          disabled={JSON.stringify(mutableData) === JSON.stringify(data)}
        />
      </ButtonsWrapper>
      <EditCustomField
        editingField={editingField}
        onlyOptionsEditable={onlyOptionsEditable}
        onClose={() => {
          setEditingField(null);
          setIsNewField(false);
        }}
        onSaveField={onSaveField}
        isNewField={isNewField}
      />
    </>
  );
};

const EditCustomField = ({ editingField, onClose, onSaveField, isNewField, onlyOptionsEditable }) => {
  const open = Boolean(editingField) || isNewField;

  return (
    <CreateStyle>
      <Modal key={isNewField || editingField?.name} isOpen={open} toggle={() => onClose(null)} size="lg" backdrop="static">
        <ModalHeader toggle={() => onClose(null)}>{!isNewField ? 'Modifier le champ' : 'Créer un nouveau champ'}</ModalHeader>
        <ModalBody>
          <Formik key={open} initialValues={editingField || newField()} onSubmit={onSaveField}>
            {({ values: field, handleChange, handleSubmit, isSubmitting }) => {
              return (
                <React.Fragment>
                  <Row>
                    <Col md={12}>
                      <FormGroup>
                        <Label htmlFor="label">Nom</Label>
                        <Input type="textarea" id="label" name="label" value={field.label} onChange={handleChange} disabled={onlyOptionsEditable} />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label htmlFor="type">Type</Label>
                        <SelectCustom
                          inputId="type"
                          isDisabled={onlyOptionsEditable}
                          options={typeOptions}
                          value={getValueFromType(field.type)}
                          onChange={({ value }) => handleChange({ currentTarget: { value, name: 'type' } })}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      {!!['enum', 'multi-choice'].includes(field.type) && (
                        <FormGroup>
                          <Label htmlFor="options">Choix</Label>
                          <SelectCustom
                            inputId="options"
                            creatable
                            options={[...(editingField?.options || field?.options || [])]
                              .sort((c1, c2) => c1.localeCompare(c2))
                              .map((opt) => ({ value: opt, label: opt }))}
                            value={(field.options || []).map((opt) => ({ value: opt, label: opt }))}
                            isMulti
                            onChange={(v) => handleChange({ currentTarget: { value: v.map((v) => v.value), name: 'options' } })}
                          />
                        </FormGroup>
                      )}
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label />
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                          <label htmlFor="enabled">Activé</label>
                          <Input
                            id="enabled"
                            type="checkbox"
                            disabled={onlyOptionsEditable}
                            name="enabled"
                            checked={field.enabled}
                            onChange={handleChange}
                          />
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label />
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                          <label htmlFor="showInStats">Voir dans les statistiques</label>
                          <Input
                            type="checkbox"
                            id="showInStats"
                            disabled={onlyOptionsEditable}
                            name="showInStats"
                            checked={field.showInStats}
                            onChange={handleChange}
                          />
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                  <br />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <ButtonCustom
                      disabled={isSubmitting || !field.label}
                      loading={isSubmitting}
                      onClick={() => !isSubmitting && handleSubmit()}
                      title="Enregistrer"
                    />
                  </div>
                </React.Fragment>
              );
            }}
          </Formik>
        </ModalBody>
      </Modal>
    </CreateStyle>
  );
};

const CreateStyle = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

const EditButton = styled.button`
  width: 30px;
  border: none;
  background: transparent;
`;

const CellWrapper = styled.div`
  width: 150px;
  margin: auto;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 40px;
  margin-bottom: 40px;
  width: 100%;
  > *:not(:last-child) {
    margin-right: 15px;
  }
`;

export default TableCustomFields;
