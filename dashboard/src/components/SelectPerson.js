import React from 'react';
import { Label } from 'reactstrap';
import { usePersons } from '../recoil/persons';
import SelectCustom from './SelectCustom';

const SelectPerson = ({ value = '', onChange, isMulti = false, noLabel = false, ...props }) => {
  const { persons } = usePersons();

  return (
    <>
      {!noLabel && <Label>{isMulti ? 'Personnes(s) suivie(s)' : 'Personne suivie'}</Label>}
      <SelectCustom
        options={persons}
        name="person"
        isMulti={isMulti}
        isSearchable
        onChange={(person) => {
          onChange({ currentTarget: { value: isMulti ? person.map((p) => p._id) : person._id, name: 'person' } });
        }}
        value={isMulti ? persons.filter((i) => value?.includes(i._id)) : persons.find((i) => i._id === value)}
        getOptionValue={(i) => i._id}
        getOptionLabel={(i) => i?.name || ''}
        {...props}
      />
    </>
  );
};

export default SelectPerson;
