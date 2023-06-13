import React from 'react';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../../recoil/auth';
import GroupRow from './GroupRow';
import { groupSelector } from '../../recoil/groups';
import { capture } from '../../services/sentry';

const Group = ({ personDB, navigation }) => {
  const organisation = useRecoilValue(organisationState);
  const personGroup = useRecoilValue(groupSelector({ personId: personDB?._id }));

  const onGroupFeaturePress = () => {
    Alert.alert(
      "Cette fonctionnalité n'est pas encore disponible sur l'app",
      "Elle l'est sur navigateur, mais si elle vous intéresse sur l'app, n'hésitez pas à nous le signaler en cliquant sur le bouton ci-dessous",
      [
        {
          text: "Ça m'intéresse !",
          onPress: () => capture('interested in families in app', { extra: { organisation } }),
        },
        {
          text: 'Non merci',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Liens familiaux" onBack={navigation.goBack} onAdd={onGroupFeaturePress} />
      <ScrollContainer noPadding>
        {personGroup.relations.map((relation) => (
          <GroupRow key={relation._id} relation={relation} onMorePress={onGroupFeaturePress} />
        ))}
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Group;
