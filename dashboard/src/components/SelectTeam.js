import React from 'react';
import SelectCustom from './SelectCustom';

const SelectTeam = ({ name, onChange = () => null, teamId = null, teams = null, style = null, inputId = '' }) => {
  if (!teams) return <div />;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: '5px',
        ...style,
      }}>
      <SelectCustom
        name={name}
        options={teams.map(({ _id }) => _id)}
        value={[teamId]}
        onChange={(id) => onChange(teams.find((team) => team._id === id))}
        getOptionValue={(id) => id}
        getOptionLabel={(id) => teams.find((team) => team._id === id)?.name}
        isClearable={false}
        inputId={inputId}
        classNamePrefix={inputId}
      />
    </div>
  );
};

export default SelectTeam;
