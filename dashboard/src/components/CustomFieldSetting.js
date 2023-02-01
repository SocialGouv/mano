import React from 'react';
import { typeOptions } from '../utils';
import { useRecoilValue } from 'recoil';
import { teamsState } from '../recoil/auth';

const CustomFieldSetting = ({ customField }) => {
  const { name, type, label, options = [], enabledTeams, enabled } = customField;
  const teams = useRecoilValue(teamsState);
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-justify-start" id={name}>
      <p className="tw-m-0 tw-break-keep">{label}</p>
      <p className="tw-m-0 tw-break-keep tw-pl-8 tw-text-xs  tw-opacity-50">
        {typeOptions.find((opt) => opt.value === type)?.label}
        {!options?.length ? '' : `: ${options.join(', ')}`}
      </p>
      <p className="tw-m-0 tw-break-keep tw-pl-8 tw-text-xs  tw-opacity-50">
        {!enabled && enabledTeams?.length
          ? `Visible par ${enabledTeams.map((teamId) => teams.find((_team) => _team._id === teamId)?.name).join(', ')}`
          : 'Visible par tous'}
      </p>
    </div>
  );
};

export default CustomFieldSetting;
