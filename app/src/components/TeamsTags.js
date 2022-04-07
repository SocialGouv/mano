import React from 'react';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import { MyText } from './MyText';
import colors from '../utils/colors';
import { teamsState } from '../recoil/auth';

const teamsColors = ['#255c99', '#74776bff', '#00c6a5ff', '#ff4b64ff', '#ef798aff'];

const TeamsTags = ({ teams = [] }) => {
  const allTeams = useRecoilValue(teamsState);

  if (!teams?.length) return null;

  return (
    <TeamsContainer>
      {teams?.map((teamId) => {
        if (!teamId) return;
        if (!allTeams?.length) return;
        const teamIndex = allTeams.findIndex((t) => t._id === teamId);
        if (teamIndex === -1) return;
        const team = allTeams[teamIndex];
        const backgroundColor = allTeams.map((t) => t._id).includes(teamId) ? teamsColors[teamIndex % allTeams.length] : '#000';
        return (
          <Team key={team?._id} backgroundColor={backgroundColor}>
            {team?.name}
          </Team>
        );
      })}
    </TeamsContainer>
  );
};

const TeamsContainer = styled.View`
  margin-top: 10px;
  color: ${colors.app.color};
  flex-grow: 0;
  flex-direction: row;
  flex-wrap: wrap;
`;

const Team = styled(MyText)`
  background-color: ${(props) => props.backgroundColor || colors.app.color};
  margin-right: 10px;
  margin-bottom: 5px;
  padding: 2px 10px;
  border-radius: 5px;
  overflow: hidden;
  line-height: 18px;
  flex-grow: 0;
  color: #fff;
`;

export default TeamsTags;
