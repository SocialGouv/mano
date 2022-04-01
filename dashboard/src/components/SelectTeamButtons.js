import React from 'react';
import { theme } from '../config';
import SelectCustom from './SelectCustom';

const SelectTeam = ({ onChange = () => null, teamId = null, teams = null }) => {
  if (!teams) return <div />;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: theme.main,
        borderRadius: '5px',
      }}>
      <SelectCustom
        options={teams.map(({ _id }) => _id)}
        value={[teamId]}
        onChange={(id) => onChange(teams.find((team) => team._id === id))}
        getOptionValue={(id) => id}
        getOptionLabel={(id) => teams.find((team) => team._id === id)?.name}
        isClearable={false}
      />
    </div>
  );
};

export default SelectTeam;
