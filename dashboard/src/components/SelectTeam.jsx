import React, { useEffect } from 'react';
import SelectCustom from './SelectCustom';

const SelectTeam = ({ name, onChange = () => null, teamId = null, teams = null, style = null, inputId = '' }) => {
  useEffect(() => {
    if (teams?.length === 1 && !teamId) onChange(teams[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  if (!teams) return <div />;

  return (
    <div style={style} className="tw-flex tw-w-full tw-flex-col tw-rounded-md">
      <SelectCustom
        name={name}
        onChange={onChange}
        value={teams.find((_team) => _team._id === teamId)}
        options={teams}
        getOptionValue={(team) => team._id}
        getOptionLabel={(team) => team.name}
        isClearable={false}
        inputId={inputId}
        classNamePrefix={inputId}
      />
    </div>
  );
};

export default SelectTeam;
