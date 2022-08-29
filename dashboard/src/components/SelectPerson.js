import React from 'react';
import { useHistory } from 'react-router-dom';
import { Label } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { personsState } from '../recoil/persons';
import ButtonCustom from './ButtonCustom';
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
  const history = useHistory();

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
        formatOptionLabel={(i, options) => {
          if (options.context === 'menu') return i?.name || '';
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {i?.name}
              <ButtonCustom
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  history.push(`/person/${i._id}`);
                }}
                color="link"
                title="Accéder au dossier"
                padding="0"
                style={{ marginLeft: '0.5rem' }}
              />
            </div>
          );
        }}
        {...props}
      />
    </>
  );
};

export default SelectPerson;
