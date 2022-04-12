import React from 'react';
import { Label } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { personsState } from '../recoil/persons';
import SelectCustom from './SelectCustom';

const SelectPerson = ({
  value = '',
  onChange,
  isMulti = false,
  noLabel = false,
  isClearable = false,
  inputId = 'person',
  name = 'person',
  ...props
}) => {
  const persons = useRecoilValue(personsState);

  return (
    <>
      {!noLabel && <Label htmlFor={inputId}>{isMulti ? 'Personnes(s) suivie(s)' : 'Personne suivie'}</Label>}
      <SelectCustom
        options={persons}
        name={name}
        inputId={inputId}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable
        onChange={(person) => onChange({ currentTarget: { value: isMulti ? person.map((p) => p._id) : person?._id, name } })}
        value={isMulti ? persons.filter((i) => value?.includes(i._id)) : persons.find((i) => i._id === value)}
        getOptionValue={(i) => i._id}
        getOptionLabel={(i) => i?.name || ''}
        {...props}
      />
    </>
  );
};

export default SelectPerson;
