import React, { useState } from 'react';
import { Linking, Alert, TouchableWithoutFeedback } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Row from '../../components/Row';
import Spacer from '../../components/Spacer';
import API from '../../services/api';
import ScrollContainer from '../../components/ScrollContainer';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import { FRAMAFORM_MANO, MANO_DOWNLOAD_URL } from '../../config';

const Menu = ({ navigation, context }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  return (
    <SceneContainer>
      <ScreenTitle title="Profil" />
      <ScrollContainer noPadding>
        <Spacer height={50} />
        <Row withNextButton caption="Donnez votre avis sur l'app" onPress={() => Linking.openURL(FRAMAFORM_MANO)} />
        <Row withNextButton caption="Soliguide" onPress={() => Linking.openURL('https://soliguide.fr')} />
        <Row withNextButton caption="Mentions Légales" onPress={() => navigation.navigate('Legal')} />
        <Row withNextButton caption="Politique de Confidentialité" onPress={() => navigation.navigate('Privacy')} />
        <Row withNextButton caption="Charte des utilisateurs" onPress={() => navigation.navigate('Charte')} />
        <Row withNextButton caption="Changer le mot de passe" onPress={() => navigation.navigate('ChangePassword')} />
        <Row withNextButton caption="Changer d'équipe" onPress={() => navigation.navigate('ChangeTeam')} />
        <Row withNextButton caption="Télécharger Mano" onPress={() => Linking.openURL(MANO_DOWNLOAD_URL)} />
        <Row
          withNextButton
          caption="Déconnexion"
          loading={isLoggingOut}
          Component={TouchableWithoutFeedback}
          onPress={async () => {
            setIsLoggingOut(true);
            API.logout();
            context.resetAuth();
          }}
        />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default withContext(AuthContext)(Menu);
