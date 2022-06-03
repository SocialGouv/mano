import React, { useState } from 'react';
import { Alert, Linking, TouchableWithoutFeedback } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Row from '../../components/Row';
import Spacer from '../../components/Spacer';
import API from '../../services/api';
import ScrollContainer from '../../components/ScrollContainer';
import { FRAMAFORM_MANO, MANO_DOWNLOAD_URL } from '../../config';
import { useRecoilValue, useResetRecoilState } from 'recoil';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';

const Menu = ({ navigation }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const resetOrganisation = useResetRecoilState(organisationState);
  const resetUser = useResetRecoilState(userState);
  const resetTeams = useResetRecoilState(teamsState);
  const resetCurrentTeam = useResetRecoilState(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  return (
    <SceneContainer>
      <ScreenTitle title="Menu" />
      <ScrollContainer noPadding>
        <Spacer height={30} />
        <Row
          withNextButton
          caption={`Comptes-rendus de l'équipe ${currentTeam?.name}`}
          onPress={() => {
            if (!organisation.migrations.includes('reports-from-real-date-to-date-id')) {
              return Alert.alert(
                "Veuillez d'abord vous connecter une fois sur votre navigateur Web",
                "Une mise à jour des comptes-rendus doit avoir lieu pour les rendre compatible avec l'app Mano." +
                  " Une fois que c'est réalisé, vous pouvez relancer l'app et accéder aux comptes-rendus."
              );
            }
            navigation.navigate('Reports');
          }}
        />
        <Row withNextButton caption="Structures" onPress={() => navigation.navigate('Structures')} />
        <Row withNextButton caption="Soliguide" onPress={() => Linking.openURL('https://soliguide.fr')} />
        <Spacer height={30} />
        <Row withNextButton caption={`Changer d'équipe (actuellement ${currentTeam?.name})`} onPress={() => navigation.navigate('ChangeTeam')} />
        <Row withNextButton caption="Changer le mot de passe" onPress={() => navigation.navigate('ChangePassword')} />
        <Spacer height={30} />
        <Row withNextButton caption="Donnez votre avis sur l'app" onPress={() => Linking.openURL(FRAMAFORM_MANO)} />
        <Row withNextButton caption="Télécharger Mano" onPress={() => Linking.openURL(MANO_DOWNLOAD_URL)} />
        <Spacer height={30} />
        <Row withNextButton caption="Charte des utilisateurs" onPress={() => navigation.navigate('Charte')} />
        <Row withNextButton caption="Mentions Légales" onPress={() => navigation.navigate('Legal')} />
        <Row withNextButton caption="Politique de Confidentialité" onPress={() => navigation.navigate('Privacy')} />
        <Spacer height={30} />
        <Row
          caption="Déconnexion"
          color="#F00"
          loading={isLoggingOut}
          Component={TouchableWithoutFeedback}
          onPress={async () => {
            setIsLoggingOut(true);
            API.logout();
            resetOrganisation();
            resetUser();
            resetTeams();
            resetCurrentTeam();
          }}
        />
        <Spacer height={30} />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Menu;
