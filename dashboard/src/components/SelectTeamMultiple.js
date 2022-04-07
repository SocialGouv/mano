import React from 'react';
import { useRecoilValue } from 'recoil';
import { teamsState } from '../recoil/auth';
import SelectCustom from './SelectCustom';

const SelectTeamMultiple = ({ onChange, value = [], inputId, classNamePrefix }) => {
  const teams = useRecoilValue(teamsState);
  return (
    <SelectCustom
      options={teams.map(({ _id }) => _id)}
      onChange={onChange}
      value={value}
      getOptionValue={(id) => id}
      getOptionLabel={(id) => teams.find((team) => team._id === id)?.name}
      isMulti
      inputId={inputId}
      classNamePrefix={classNamePrefix}
    />
  );
};

export default SelectTeamMultiple;
