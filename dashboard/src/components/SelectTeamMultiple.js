/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext } from 'react';
import AuthContext from '../contexts/auth';
import SelectCustom from './SelectCustom';

const SelectTeamMultiple = ({ onChange, value = [] }) => {
  const { teams } = useContext(AuthContext);

  return (
    <SelectCustom
      options={teams.map(({ _id }) => _id)}
      onChange={onChange}
      value={value}
      getOptionValue={(id) => id}
      getOptionLabel={(id) => teams.find((team) => team._id === id)?.name}
      isMulti
      // isClearable
      placeholder={' -- Choisir -- '}
    />
  );
};

export default SelectTeamMultiple;
