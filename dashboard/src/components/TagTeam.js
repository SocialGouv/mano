import React from 'react';
import { useRecoilValue } from 'recoil';
import { teamsState } from '../recoil/auth';

const TagTeam = ({ teamId, className = '' }) => {
  const teams = useRecoilValue(teamsState);
  const teamIndex = teams?.findIndex((t) => t._id === teamId);
  const team = teams?.find((t) => t._id === teamId);
  if (!team) return null;
  return (
    <div
      key={team?._id}
      style={{
        backgroundColor: teamsColors[teamIndex % teamsColors?.length],
        borderColor: borderColors[teamIndex % borderColors?.length],
      }}
      className={['tw-rounded tw-border tw-py-0.5 tw-px-2.5 tw-text-center tw-text-xs tw-text-white', className].join(' ')}>
      {team?.name}
    </div>
  );
};

const teamsColors = ['#255c99cc', '#74776bcc', '#00c6a5cc', '#ff4b64cc', '#ef798acc'];
const borderColors = ['#255c99', '#74776b', '#00c6a5', '#ff4b64', '#ef798a'];

export default TagTeam;
