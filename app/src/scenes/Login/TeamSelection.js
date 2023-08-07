import React, { useState } from 'react';
import styled from 'styled-components';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import colors from '../../utils/colors';
import Button from '../../components/Button';
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

  const user = useRecoilValue(userState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const teams = user.teams || [];
  const [teamIndex, setTeamIndex] = useState(0);

  const onTeamSelected = async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: true, initialLoad: true } });
    setCurrentTeam(user.teams[teamIndex]);
    onSelect();
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Choisissez une équipe" backgroundColor={colors.app.color} color={'white'} offset />
      <Wrapper>
        <View>
          {teams.map(({ _id, name }, i) => (
            <TouchableOpacity key={_id} activeOpacity={0.9} onPress={() => setTeamIndex(i)}>
              <Team selected={teamIndex === i}>{name}</Team>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          caption={`Choisissez ${teams[teamIndex].name}`}
          backgroundColor={colors.action.backgroundColor}
          color={colors.action.color}
          style={{ width: '100%' }}
          onPress={onTeamSelected}
        />
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
  margin-top: 100px;
  justify-content: space-between;
  flex: 1;
  padding-bottom: 20px;
`;

const TeamContainer = styled.TouchableOpacity`
  margin-vertical: 10px;
  padding-vertical: 25px;
  background-color: ${colors.app.color}15;
  border-radius: 12px;
`;

const Team = styled.Text`
  text-align: center;
  background-color: ${(p) => (p.selected ? colors.teamSelection.selectedBackgroundColor : colors.teamSelection.backgroundColor)};
  color: ${colors.teamSelection.color};
  padding-vertical: 20px;
  margin-vertical: 10px;
  border-radius: 20px;
`;
