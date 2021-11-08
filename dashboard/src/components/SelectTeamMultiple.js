/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import useAuth from '../recoil/auth';
import SelectCustom from './SelectCustom';

const SelectTeamMultiple = ({ onChange, value = [] }) => {
  const { teams } = useAuth();
  return (
    <SelectCustom
      options={teams.map(({ _id }) => _id)}
      onChange={onChange}
      value={value}
      getOptionValue={(id) => id}
      getOptionLabel={(id) => teams.find((team) => team._id === id)?.name}
      isMulti
      // isClearable
    />
  );
};

export default SelectTeamMultiple;
