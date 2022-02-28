import React, { useState } from 'react';
import styled from 'styled-components';
import { ActivityIndicator } from 'react-native';
import colors from '../../utils/colors';
import SceneContainer from '../../components/SceneContainer';
import ScrollContainer from '../../components/ScrollContainer';
import { MyText } from '../../components/MyText';
import Title from '../../components/Title';
import ScreenTitle from '../../components/ScreenTitle';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentTeamState, userState } from '../../recoil/auth';
import { refreshTriggerState } from '../../components/Loader';

const TeamBody = ({ onSelect }) => {
  const [loading, setLoading] = useState(false);
  const user = useRecoilValue(userState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);

  const onTeamSelected = async (teamIndex) => {
    setLoading(teamIndex);
    setRefreshTrigger({ status: true, options: { showFullScreen: true, initialLoad: true } });
    setCurrentTeam(user.teams[teamIndex]);
    setLoading(false);
    onSelect();
  };

  return (
    <ScrollContainer backgroundColor="#fff">
      {user?.teams?.map(({ _id, name }, i) => (
        <TeamContainer disabled={loading} key={_id} onPress={() => onTeamSelected(i)}>
          {loading === i ? <ActivityIndicator size="small" color={colors.app.color} /> : <Team bold>{name}</Team>}
        </TeamContainer>
      ))}
    </ScrollContainer>
  );
};

export const TeamSelection = (props) => {
  const onSelect = () =>
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });

  return (
    <SceneContainer backgroundColor="#fff">
      <Title>Choisissez une équipe</Title>
      <Wrapper>
        <TeamBody onSelect={onSelect} {...props} />
      </Wrapper>
    </SceneContainer>
  );
};

export const ChangeTeam = (props) => {
  const onSelect = () => {
    props.navigation.goBack();
  };
  return (
    <SceneContainer>
      <ScreenTitle title="Choisissez une équipe" onBack={props.navigation.goBack} />
      <TeamBody onSelect={onSelect} {...props} />
    </SceneContainer>
  );
};

const Wrapper = styled.View`
  display: flex;
  flex-direction: column;
  padding-horizontal: 20px;
  flex: 1;
  padding-bottom: 20px;
`;

const TeamContainer = styled.TouchableOpacity`
  margin-vertical: 10px;
  padding-vertical: 25px;
  background-color: ${colors.app.color}15;
  border-radius: 12px;
`;

const Team = styled(MyText)`
  text-align: center;
  color: ${colors.app.color};
`;
