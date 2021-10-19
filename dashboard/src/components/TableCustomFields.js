import React, { useContext, useState } from 'react';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import AuthContext from '../contexts/auth';
import API from '../services/api';
import ButtonCustom from './ButtonCustom';
import SelectCustom from './SelectCustom';
import Table from './table';

const typeOptions = [
  { value: 'text', label: 'Texte' },
  { value: 'textarea', label: 'Zone de texte multi-lignes' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'yes-no', label: 'Oui/Non' },
  { value: 'enum', label: 'Choix dans une liste' },
  { value: 'multi-choice', label: 'Choix multiple dans une liste' },
  { value: 'boolean', label: 'Case à cocher' },
];

const newField = () => ({
  name: `custom-${new Date().toISOString().split('.').join('-').split(':').join('-')}`,
  label: '',
  type: 'Texte',
  enabled: false,
  required: false,
});

const getValueFromType = (type) => typeOptions.find((opt) => opt.value === type);

const TableCustomeFields = ({ data, customFields }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutableData, setMutableData] = useState(data);
  const { organisation, setAuth } = useContext(AuthContext);

  const onLabelChange = (fieldToUpdate) => (event) => {
    const label = event.target.value;
    setMutableData(mutableData.map((field) => (field.name !== fieldToUpdate.name ? field : { ...fieldToUpdate, label })));
  };

  const onTypeChange = (fieldToUpdate) => (event) => {
    const type = event.value;
    setMutableData(mutableData.map((field) => (field.name !== fieldToUpdate.name ? field : { ...fieldToUpdate, type })));
  };

  const onOptionsChange = (fieldToUpdate) => (values) => {
    const options = values.map((options) => options.value);
    setMutableData(mutableData.map((field) => (field.name !== fieldToUpdate.name ? field : { ...fieldToUpdate, options })));
  };

  const onEnabledChange = (fieldToUpdate) => (event) => {
    const enabled = event.target.checked;
    setMutableData(mutableData.map((field) => (field.name !== fieldToUpdate.name ? field : { ...fieldToUpdate, enabled })));
  };

  const onRequiredChange = (fieldToUpdate) => (event) => {
    const required = event.target.checked;
    setMutableData(mutableData.map((field) => (field.name !== fieldToUpdate.name ? field : { ...fieldToUpdate, required })));
  };

  const onAddAField = () => {
    setMutableData([...mutableData, newField()]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log(
        mutableData,
        mutableData.filter((field) => !!field.label.length)
      );
      const response = await API.put({
        path: `/organisation/${organisation._id}`,
        body: { [customFields]: JSON.stringify(mutableData.filter((field) => !!field.label.length)) },
      });
      console.log(JSON.parse(response.data[customFields]));
      if (response.ok) {
        toastr.success('Mise à jour !');
        setAuth({ organisation: response.data });
        setMutableData(JSON.parse(response.data[customFields]));
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
        columns={[
          {
            title: 'Nom',
            dataKey: 'label',
            render: (f) => (
              <CellWrapper>
                <Name rows="2" cols="25" onChange={onLabelChange(f)} value={f.label} placeholder="Tapez ici le nom du champ" />
              </CellWrapper>
            ),
          },
          {
            title: 'Type',
            dataKey: 'type',
            render: (f) => (
              <CellWrapper>
                <SelectCustom options={typeOptions} value={getValueFromType(f.type)} onChange={onTypeChange(f)} />
              </CellWrapper>
            ),
          },
          {
            title: 'Options',
            dataKey: 'options',
            render: (f) =>
              !['enum', 'multi-choice'].includes(f.type) ? null : (
                <CellWrapper>
                  <SelectCustom
                    creatable
                    options={(f.options || []).sort((c1, c2) => c1.localeCompare(c2)).map((opt) => ({ value: opt, label: opt }))}
                    value={(f.options || []).map((opt) => ({ value: opt, label: opt }))}
                    isMulti
                    onChange={onOptionsChange(f)}
                    placeholder={' -- Choisir -- '}
                  />
                </CellWrapper>
              ),
          },
          { title: 'Activé', dataKey: 'enabled', render: (f) => <input type="checkbox" checked={f.enabled} onChange={onEnabledChange(f)} /> },
          {
            title: 'Obligatoire',
            dataKey: 'required',
            render: (f) => <input type="checkbox" checked={f.required} onChange={onRequiredChange(f)} />,
          },
        ]}
      />
      <ButtonsWrapper>
        <ButtonCustom title="Ajouter un champ" loading={isSubmitting} onClick={onAddAField} width={200} />
        <ButtonCustom title="Mettre à jour" loading={isSubmitting} onClick={handleSubmit} width={200} />
      </ButtonsWrapper>
    </>
  );
};

const Name = styled.textarea`
  resize: none;
  border-color: #ccc;
  border-radius: 4px;
  padding: 8px;
  display: inline-block;
  vertical-align: middle;
`;

const CellWrapper = styled.div`
  width: 200px;
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

export default TableCustomeFields;
