import React from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import { teamsState } from '../recoil/auth';

const TagTeam = ({ teamId, ...props }) => {
  const teams = useRecoilValue(teamsState);
  const teamIndex = teams?.findIndex((t) => t._id === teamId);
  const team = teams?.find((t) => t._id === teamId);
  if (!team) return null;
  return (
    <Team key={team?._id} teamIndex={teamIndex} {...props}>
      {team?.name}
    </Team>
  );
};

const teamsColors = ['#255c99cc', '#74776bcc', '#00c6a5cc', '#ff4b64cc', '#ef798acc'];
const borderColors = ['#255c99', '#74776b', '#00c6a5', '#ff4b64', '#ef798a'];

const Team = styled.div`
  font-size: 0.75rem;
  text-align: center;
  background-color: ${({ teamIndex }) => teamsColors[teamIndex % teamsColors?.length]};
  border: 1px ${({ teamIndex }) => borderColors[teamIndex % borderColors?.length]} solid;
  padding: 2px 10px;
  border-radius: 5px;
  color: #fff;
`;

export default TagTeam;
