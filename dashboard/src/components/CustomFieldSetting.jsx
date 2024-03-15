import React from "react";
import { typeOptions } from "../utils";
import { useRecoilValue } from "recoil";
import { teamsState } from "../recoil/auth";

const CustomFieldSetting = ({ customField }) => {
  const { type, label, options = [], showInStats } = customField;
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-justify-start" id={label} data-test-id={label}>
      <p className="tw-m-0 tw-break-keep">{label}</p>
      {!showInStats && <p className="tw-m-0 tw-break-keep tw-pl-4 tw-text-xs tw-italic tw-text-gray-600">Ne pas voir dans les statistiques</p>}
      <p className="tw-m-0 tw-break-keep tw-pl-8 tw-text-xs tw-text-gray-400">
        {typeOptions.find((opt) => opt.value === type)?.label}
        {!options?.length ? "" : `: ${options.join(", ")}`}
      </p>
      <p className="tw-m-0 tw-break-keep tw-pl-8 tw-text-xs tw-text-gray-400">
        <VisibleBy customField={customField} />
      </p>
    </div>
  );
};

const VisibleBy = ({ customField }) => {
  const { enabledTeams, enabled } = customField;
  const teams = useRecoilValue(teamsState);
  if (!enabled) {
    if (!enabledTeams?.length) {
      return <>Non activé</>;
    }
    if (enabledTeams?.length === teams.length) {
      return <>Visible par tous</>;
    }
    return <>Visible par {enabledTeams.map((teamId) => teams.find((_team) => _team._id === teamId)?.name).join(", ")}</>;
  }
  return <>Visible par tous</>;
};

export default CustomFieldSetting;
