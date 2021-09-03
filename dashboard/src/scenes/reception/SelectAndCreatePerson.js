import React, { useContext } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import SelectCustom from '../../components/SelectCustom';
import PersonsContext from '../../contexts/persons';
import styled from 'styled-components';
import { toastr } from 'react-redux-toastr';

const SelectAndCreatePerson = ({ value, onChange, autoCreate }) => {
  const { persons, addPerson } = useContext(PersonsContext);

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
          const personResponse = await addPerson({ name });
          if (personResponse.ok) {
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
