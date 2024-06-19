import React, { useEffect } from "react";
import SelectCustom from "./SelectCustom";
import type { TeamInstance } from "../types/team";
import type { SelectCustomProps } from "./SelectCustom";
import type { GroupBase, SingleValue, ActionMeta } from "react-select";

interface SelectTeamProps extends Omit<SelectCustomProps<TeamInstance, false, GroupBase<TeamInstance>>, "onChange"> {
  name: string;
  onChange?: (team: TeamInstance) => void;
  teamId?: TeamInstance["_id"] | null;
  teams?: Array<TeamInstance>;
  style?: React.CSSProperties;
  inputId?: string;
}

const SelectTeam = ({ name, onChange, teamId = null, teams = [], style = undefined, inputId = "", ...rest }: SelectTeamProps) => {
  useEffect(() => {
    if (teams?.length === 1 && !teamId && onChange) onChange(teams[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  if (!teams) return <div />;

  const handleChange = (newValue: SingleValue<TeamInstance>, _actionMeta: ActionMeta<TeamInstance>) => {
    if (onChange && newValue) {
      onChange(newValue);
    }
  };

  return (
    <div style={style} className="tw-flex tw-w-full tw-flex-col tw-rounded-md">
      <SelectCustom
        name={name}
        onChange={handleChange}
        value={teams.find((_team) => _team._id === teamId)}
        options={teams}
        getOptionValue={(team) => team._id}
        getOptionLabel={(team) => team.name}
        isClearable={false}
        inputId={inputId}
        classNamePrefix={inputId}
        {...rest}
      />
    </div>
  );
};

export default SelectTeam;
