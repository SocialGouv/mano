import React from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import colors from '../../utils/colors';
import styled from 'styled-components';
import Button from '../../components/Button';
import ButtonsContainer from '../../components/ButtonsContainer';
import SelectLabelled from '../../components/SelectLabelled';
import API from '../../api';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import needRefresh from '../../utils/needRefresh';

export const initTeam = {
  _id: '0',
  name: '-- Choissisez une équipe --',
};

class ChooseTeam extends React.Component {
  state = {
    teams: null,
    team: initTeam,
    changing: false,
    key: 0,
  };
  originalTeam = initTeam;

  async componentDidMount() {
    await this.getTeam();
    this.getTeams();
  }

  getTeams = async () => {
    const { organisation } = this.state;
    const response = await API.get({ path: '/team', query: { organisation: organisation._id } });
    if (response.error) return Alert.alert(response.error);
    const teams = response.data;
    teams.unshift(initTeam);
    this.setState(({ key }) => ({ teams, key: key + 1 }));
  };

  getTeam = async () => {
    const response = await API.get({ path: '/user' });
    if (response.error) return Alert.alert(response.error);
    const team = response.user.team;
    const organisation = response.user.organisation;
    this.setState({ team, organisation });
    this.originalTeam = team;
  };

  onUpdateTeamRequest = async () => {
    await this.onUpdateTeam();
    this.setState({ changing: false });
  };
  onUpdateTeam = async () => {
    const { team } = this.state;
    this.setState({ changing: true });
    const response = await API.put({ path: '/user', body: { team } });
    this.setState({ changing: true });
    if (response.error) {
      this.setState({ changing: false });
      Alert.alert(response.error);
      return false;
    }
    Alert.alert('Équipe mise-à-jour!');
    this.originalTeam = team;
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    return true;
  };

  onBack = () => {
    const { navigation } = this.props;
    navigation.goBack();
    setTimeout(() => {
      this.setState({ changing: false });
    }, 250);
  };

  isUpdateDisabled = () => {
    const { team } = this.state;
    return team._id === this.originalTeam._id;
  };

  onBackRequest = async () => {
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert("Voulez-vous enregistrer le changement d'équipe ?", null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await this.onUpdateTeam();
          if (ok) return this.onBack();
        },
      },
      {
        text: 'Ne pas enregistrer',
        style: 'destructive',
        onPress: this.onBack,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  render() {
    const { teams, team, key, changing } = this.state;
    return (
      <SceneContainer>
        <ScreenTitle
          title="Choisissez une équipe"
          backgroundColor={colors.menu.backgroundColor}
          onBack={this.onBackRequest}
          color={colors.menu.color}
          offset
        />
        <ScrollContainer>
          <PlaceHolder height={50} />
          <SelectLabelled
            key={key}
            label="Structure"
            values={teams ? teams : [team]}
            value={teams ? teams.find((u) => u._id === team._id) : team}
            onSelect={(team) => this.setState({ team })}
          />
          <PlaceHolder height={50} />
          <ButtonsContainer>
            <Button
              caption="Choisir"
              backgroundColor={colors.person.backgroundColor}
              color={colors.person.color}
              onPress={this.onUpdateTeamRequest}
              disabled={this.isUpdateDisabled()}
              loading={changing}
            />
          </ButtonsContainer>
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

const PlaceHolder = styled.View`
  height: ${(p) => p.height}px;
`;

export default ChooseTeam;
