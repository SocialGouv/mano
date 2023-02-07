import React from 'react';
import { typeOptions } from '../utils';
import { useRecoilValue } from 'recoil';
import { teamsState } from '../recoil/auth';

const CustomFieldSetting = ({ customField }) => {
  const { type, label, options = [] } = customField;
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-justify-start" id={label} data-test-id={label}>
      <p className="tw-m-0 tw-break-keep">{label}</p>
      <p className="tw-m-0 tw-break-keep tw-pl-8 tw-text-xs  tw-opacity-50">
        {typeOptions.find((opt) => opt.value === type)?.label}
        {!options?.length ? '' : `: ${options.join(', ')}`}
      </p>
      <p className="tw-m-0 tw-break-keep tw-pl-8 tw-text-xs  tw-opacity-50">
        <VisibleBy customField={customField} />
      </p>
    </div>
  );
};

const VisibleBy = ({ customField }) => {
  const { enabledTeams, enabled } = customField;
  const teams = useRecoilValue(teamsState);
  if (!enabled && !enabledTeams?.length) {
    return <>Non activé</>;
  }
  if (enabled || enabledTeams?.length === teams.length) {
    return <>Visible par tous</>;
  }
  if (!enabled && enabledTeams?.length) {
    return <>Visible par {enabledTeams.map((teamId) => teams.find((_team) => _team._id === teamId)?.name).join(', ')}</>;
  }
  return 'Cas non pris';
};

export default CustomFieldSetting;
