import React from 'react';
import { typeOptions } from '../utils';
import { useRecoilValue } from 'recoil';
import { teamsState } from '../recoil/auth';

const CustomFieldSetting = ({ customField }) => {
  const { type, label, options = [], showInStats } = customField;
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-justify-start" id={label} data-test-id={label}>
      <p className="tw-m-0 tw-break-keep">{label}</p>
      {!showInStats && (
        <div className="tw-flex tw-items-center tw-pl-8 tw-opacity-50">
          <NotInStatsIcon />
          <p className="tw-m-0 tw-break-keep tw-text-xs">Ne pas voir dans les statistiques</p>
        </div>
      )}
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
  if (!enabled) {
    if (!enabledTeams?.length) {
      return <>Non activé</>;
    }
    if (enabledTeams?.length === teams.length) {
      return <>Visible par tous</>;
    }
    return <>Visible par {enabledTeams.map((teamId) => teams.find((_team) => _team._id === teamId)?.name).join(', ')}</>;
  }
  return <>Visible par tous</>;
};

const NotInStatsIcon = () => (
  <svg className="tw-mr-1 tw-h-3 tw-w-3 tw-opacity-50" viewBox="0 0 134 134" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M60.6506 128.125C40.2386 128.11 21.38 117.209 11.172 99.5267C0.968887 81.844 0.968887 60.0627 11.172 42.3814C21.3802 24.6987 40.24 13.7974 60.6506 13.7827C61.3902 13.7827 62.0933 14.0744 62.6142 14.6004C63.1403 15.1212 63.4319 15.8244 63.4319 16.564V69.7987L101.271 107.211C102.359 108.284 102.37 110.034 101.302 111.127C90.6196 122.075 75.9472 128.21 60.6512 128.127L60.6506 128.125ZM57.8746 19.412C39.792 20.386 23.5413 30.7662 15.0573 46.7667C6.56769 62.7667 7.08849 82.0427 16.4218 97.5587C25.7552 113.08 42.5418 122.569 60.6512 122.569C73.4949 122.642 85.8911 117.851 95.3485 109.163L58.7032 72.9281L58.6979 72.9333C58.1719 72.4072 57.875 71.6989 57.875 70.9541L57.8746 19.412Z"
      fill="black"
    />
    <path
      d="M108.729 108.369C107.979 108.369 107.255 108.067 106.734 107.526L73.1611 72.8896C72.3851 72.0875 72.1611 70.9 72.5986 69.874C73.0309 68.8428 74.0361 68.1761 75.1559 68.1761H127.073C127.901 68.1761 128.688 68.5459 129.214 69.1814C129.74 69.822 129.959 70.6606 129.802 71.4731C129.579 72.6554 124.151 100.525 110.032 108.046H110.037C109.631 108.26 109.182 108.369 108.729 108.369ZM81.7132 73.7334L109.151 102.04C116.708 96.4046 121.598 81.9614 123.62 73.7334H81.7132Z"
      fill="black"
    />
    <path
      d="M119.115 62.3387H69.9639C69.2243 62.3387 68.5213 62.047 68.0003 61.5262C67.4794 61.0053 67.1826 60.297 67.1826 59.5574V7.98405C67.1878 7.15593 67.5576 6.36952 68.1982 5.83818C68.8389 5.30693 69.6826 5.0934 70.4952 5.26006C71.0316 5.36423 124.058 16.2653 121.886 59.6974C121.813 61.1766 120.594 62.3387 119.115 62.3387ZM72.7453 56.7814H116.396C116.162 25.672 83.4786 14.3747 72.7399 11.5054L72.7453 56.7814Z"
      fill="black"
    />
    <line x1="12.2077" y1="114.762" x2="114.762" y2="21.7923" stroke="black" stroke-width="6" stroke-linecap="round" />
  </svg>
);

export default CustomFieldSetting;
