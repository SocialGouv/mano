import React from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import SelectCustom from '../../components/SelectCustom';
import styled from 'styled-components';
import { toastr } from 'react-redux-toastr';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import { useRecoilState, useRecoilValue } from 'recoil';
import useApi from '../../services/api';

const SelectAndCreatePerson = ({ value, onChange, autoCreate, inputId, classNamePrefix }) => {
  const [persons, setPersons] = useRecoilState(personsState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const API = useApi();

  return (
    <SelectCustom
      options={persons.map((person) => ({ value: person._id, label: person.name, ...person }))}
      name="persons"
      isMulti
      isSearchable
      onChange={onChange}
      placeholder={' -- Choisir une ou plusieurs personnes -- '}
      onCreateOption={async (name) => {
        if (!autoCreate) {
          onChange([...value, { value: `temporary-id-${Date.now()}`, label: `${name} (en cours de création)`, name }]);
        } else {
          const existingPerson = persons.find((p) => p.name === name);
          if (existingPerson) return toastr.error('Un utilisateur existe déjà à ce nom');
          const personResponse = await API.post({
            path: '/person',
            body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)({ name }),
          });
          if (personResponse.ok) {
            setPersons((persons) => [personResponse.decryptedData, ...persons].sort((p1, p2) => p1.name.localeCompare(p2.name)));
            toastr.success('Nouvelle personne ajoutée !');
            onChange([...value, personResponse.decryptedData]);
          }
        }
      }}
      value={value}
      formatOptionLabel={(person) => {
        if (person.__isNew__) return <span>Créer "{person.value}"</span>;
        return (
          <span>
            {!!person.alertness && <Alertness>!</Alertness>}
            {person.name}
          </span>
        );
      }}
      format
      creatable
      inputId={inputId}
      classNamePrefix={classNamePrefix}
    />
  );
};

const Alertness = styled.span`
  display: inline-block;
  margin-right: 20px;
  text-align: center;
  color: red;
  font-weight: bold;
`;

export default SelectAndCreatePerson;
