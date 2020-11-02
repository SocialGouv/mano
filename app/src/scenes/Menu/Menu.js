import React from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import colors from '../../utils/colors';
import Row from '../../components/Row';
import { Linking } from 'react-native';
import styled from 'styled-components';

const Menu = ({ navigation }) => (
  <SceneContainer>
    <ScreenTitle
      title={'AUTRE'}
      backgroundColor={colors.menu.backgroundColor}
      color={colors.menu.color}
      offset
    />
    <PlaceHolder height={50} />
    <Row
      withNextButton
      caption="Choisir votre équipe"
      onPress={() => navigation.navigate('ChooseTeam')}
    />
    <Row
      withNextButton
      caption="Donnez votre avis sur l'app"
      onPress={() =>
        Linking.openURL('https://framaforms.org/questionnaire-de-satisfaction-mano-1600157921')
      }
    />

    <Row
      withNextButton
      caption="Soliguide"
      onPress={() => Linking.openURL('https://soliguide.fr')}
    />
    <Row withNextButton caption="Déconnexion" onPress={() => navigation.navigate('Login')} />
  </SceneContainer>
);

const PlaceHolder = styled.View`
  height: ${(p) => p.height}px;
`;

export default Menu;
