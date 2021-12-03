import { Formik } from 'formik';
import React, { useState } from 'react';
import { toastr } from 'react-redux-toastr';
import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import styled from 'styled-components';
import { useAuth } from '../recoil/auth';
import useApi from '../services/api-interface-with-dashboard';
import ButtonCustom from './ButtonCustom';
import SelectCustom from './SelectCustom';
import Table from './table';

const typeOptions = [
  { value: 'text', label: 'Texte' },
  { value: 'textarea', label: 'Zone de texte multi-lignes' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date sans heure' },
  { value: 'date-with-time', label: 'Date avec heure' },
  { value: 'yes-no', label: 'Oui/Non' },
  { value: 'enum', label: 'Choix dans une liste' },
  { value: 'multi-choice', label: 'Choix multiple dans une liste' },
  { value: 'boolean', label: 'Case à cocher' },
];

const newField = () => ({
  name: `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`,
  label: '',
  type: 'text',
  enabled: false,
  required: false,
  showInStats: false,
});

const getValueFromType = (type) => typeOptions.find((opt) => opt.value === type);

const TableCustomFields = ({ data, customFields }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutableData, setMutableData] = useState(data);
  const [editingField, setEditingField] = useState(null);
  const [isNewField, setIsNewField] = useState(null);
  const { organisation, setOrganisation } = useAuth();
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
      const dataToSave = mutableData.filter((f) => f.name !== fieldToDelete.name);
      setMutableData(dataToSave);
      handleSubmit(dataToSave);
    }
  };

  const handleSubmit = async (newData) => {
    if (!newData) newData = mutableData.filter((field) => !!field.label.length);
    setIsSubmitting(true);
    try {
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { [customFields]: newData },
      });
      if (response.ok) {
        toastr.success('Mise à jour !');
        setOrganisation(response.data);
        setMutableData(response.data[customFields]);
      }
    } catch (orgUpdateError) {
      console.log('error in updating organisation', orgUpdateError);
      toastr.error('Erreur!', orgUpdateError.message);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Table
        data={mutableData}
        rowKey="name"
        noData="Pas de champs personnalisés"
        columns={[
          {
            dataKey: '_id',
            render: (field) => <EditButton onClick={() => setEditingField(field)}>&#9998;</EditButton>,
            small: true,
          },
          {
            title: 'Nom',
            dataKey: 'label',
            render: (f) => (
              <CellWrapper>
                <span>{f.label}</span>
              </CellWrapper>
            ),
          },
          {
            title: 'Type',
            dataKey: 'type',
            render: (f) => (
              <CellWrapper>
                <span>{getValueFromType(f.type).label}</span>
              </CellWrapper>
            ),
          },
          {
            title: 'Options',
            dataKey: 'options',
            render: (f) => <CellWrapper>{!['enum', 'multi-choice'].includes(f.type) ? null : (f?.options || []).join(', ')}</CellWrapper>,
          },
          { title: 'Activé', dataKey: 'enabled', render: (f) => <input type="checkbox" checked={f.enabled} onChange={onEnabledChange(f)} /> },
          // {
          //   title: 'Obligatoire',
          //   dataKey: 'required',
          //   render: (f) => <input type="checkbox" checked={f.required} onChange={onRequiredChange(f)} />,
          // },
          {
            title: (
              <>
                Voir dans les
                <br />
                satistiques
              </>
            ),
            dataKey: 'showInStats',
            render: (f) => <input type="checkbox" checked={f.showInStats} onChange={onShowStatsChange(f)} />,
          },
          {
            title: '',
            dataKey: 'name',
            small: true,
            render: (f) => <ButtonCustom title="Supprimer" loading={isSubmitting} onClick={() => onDelete(f)} width={75} color="danger" />,
          },
        ]}
      />
      <ButtonsWrapper>
        <ButtonCustom title="Ajouter un champ" loading={isSubmitting} onClick={() => setIsNewField(true)} width={200} />
        <ButtonCustom title="Mettre à jour" loading={isSubmitting} onClick={() => handleSubmit()} width={200} />
      </ButtonsWrapper>
      <EditCustomField
        editingField={editingField}
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

const EditCustomField = ({ editingField, onClose, onSaveField, isNewField }) => {
  const open = Boolean(editingField) || isNewField;

  return (
    <CreateStyle>
      <Modal key={isNewField || editingField?.name} isOpen={open} toggle={() => onClose(null)} size="lg">
        <ModalHeader toggle={() => onClose(null)}>{isNewField ? 'Modifier le champ' : 'Créer une nouveau champ'}</ModalHeader>
        <ModalBody>
          <Formik key={open} initialValues={editingField || newField()} onSubmit={onSaveField}>
            {({ values: field, handleChange, handleSubmit, isSubmitting }) => {
              return (
                <React.Fragment>
                  <Row>
                    <Col md={12}>
                      <FormGroup>
                        <Label>Nom</Label>
                        <Input type="textarea" name="label" value={field.label} onChange={handleChange} />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label>Type</Label>
                        <SelectCustom
                          options={typeOptions}
                          value={getValueFromType(field.type)}
                          onChange={({ value }) => handleChange({ currentTarget: { value, name: 'type' } })}
                        />
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      {!!['enum', 'multi-choice'].includes(field.type) && (
                        <FormGroup>
                          <Label>Type</Label>
                          <SelectCustom
                            creatable
                            options={[...(field.options || []) /* Do not mutate immutable property thanks to spread operator. */]
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
                        <Label></Label>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                          <span>Activé</span>
                          <Input type="checkbox" name="enabled" checked={field.enabled} onChange={handleChange} />
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md={6}>
                      <FormGroup>
                        <Label></Label>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                          <span>Voir dans les satistiques</span>
                          <Input type="checkbox" name="showInStats" checked={field.showInStats} onChange={handleChange} />
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>
                  <br />
                  <ButtonCustom
                    color="info"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    onClick={() => !isSubmitting && handleSubmit()}
                    title="Enregistrer"
                  />
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
  margin-top: 40px;
  margin-bottom: 40px;
  width: 100%;
  > *:not(:last-child) {
    margin-right: 15px;
  }
`;

export default TableCustomFields;
