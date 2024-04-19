import React, { useState } from 'react';
import { Linking, TouchableWithoutFeedback } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Row from '../../components/Row';
import Spacer from '../../components/Spacer';
import API from '../../services/api';
import ScrollContainer from '../../components/ScrollContainer';
import { FRAMAFORM_MANO, MANO_DOWNLOAD_URL, MANO_TEST_ORGANISATION_ID } from '../../config';
import { useRecoilValue } from 'recoil';
import { currentTeamState, organisationState } from '../../recoil/auth';
import { capture } from '../../services/sentry';

const Menu = ({ navigation }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  const onLogoutRequest = async (clearAll = false) => {
    setIsLoggingOut(true);
    API.logout(clearAll);
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Menu" />
      <ScrollContainer noPadding>
        <Spacer height={30} />
        <Row
          withNextButton
          caption={`Comptes-rendus de l'équipe ${currentTeam?.name}`}
          onPress={() => {
            navigation.navigate('Reports');
          }}
        />
        <Row withNextButton caption="Structures" onPress={() => navigation.navigate('Structures')} />
        <Row withNextButton caption="Soliguide" onPress={() => navigation.navigate('Soliguide')} />
        <Spacer height={30} />
        <Row withNextButton caption={`Changer d'équipe (actuellement ${currentTeam?.name})`} onPress={() => navigation.navigate('ChangeTeam')} />
        <Row withNextButton caption="Changer le mot de passe" onPress={() => navigation.navigate('ChangePassword')} />
        <Spacer height={30} />
        <Row withNextButton caption="Donnez votre avis sur l'app" onPress={() => Linking.openURL(FRAMAFORM_MANO)} />
        <Row withNextButton caption="Télécharger Mano" onPress={() => Linking.openURL(MANO_DOWNLOAD_URL)} />
        <Spacer height={30} />
        <Row withNextButton caption="Charte des utilisateurs" onPress={() => navigation.navigate('Charte')} />
        <Row withNextButton caption="Conditions générales d'utilisation" onPress={() => navigation.navigate('Cgu')} />
        <Row withNextButton caption="Mentions Légales" onPress={() => navigation.navigate('Legal')} />
        <Row withNextButton caption="Politique de Confidentialité" onPress={() => navigation.navigate('Privacy')} />
        <Spacer height={30} />
        {(__DEV__ || organisation._id === MANO_TEST_ORGANISATION_ID) && (
          <>
            <Row
              caption="Test Sentry"
              onPress={() => {
                capture('Test Sentry Capture', { extra: { test: 'test' } });
                // throw new Error('Test Sentry Error Crash');
              }}
            />
            <Spacer height={30} />
          </>
        )}
        <Row caption="Se déconnecter" color="#F00" loading={isLoggingOut} Component={TouchableWithoutFeedback} onPress={() => onLogoutRequest()} />
        <Row
          caption="Se déconnecter et vider le cache"
          color="#F00"
          loading={isLoggingOut}
          Component={TouchableWithoutFeedback}
          onPress={() => onLogoutRequest(true)}
        />
        <Spacer height={30} />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Menu;
