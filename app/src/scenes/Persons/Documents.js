import React, { useState } from 'react';
import { Alert, Modal } from 'react-native';
import styled from 'styled-components';
import ScrollContainer from '../../components/ScrollContainer';
import SubHeader from '../../components/SubHeader';
import Button from '../../components/Button';
import colors from '../../utils/colors';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import API from '../../services/api';
import { capture } from '../../services/sentry';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/auth';
import Spacer from '../../components/Spacer';
import { alertPhotosSetting, getCameraPermission, getPhotoLibraryPermission } from '../../services/permissions-photo';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';

const Documents = ({ updating, personDB, navigation, onUpdatePerson, backgroundColor }) => {
  const user = useRecoilValue(userState);
  const [asset, setAsset] = useState(null);
  const [name, setName] = useState('');
  const handleSavePicture = async (result) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Désolé, une erreur est survenue', "L'équipe technique a été prévenue");
      capture('error selecting picture from library', { extra: { result } });
    }
    setAsset(result.assets[0]);
  };

  const sendPictureToDB = async () => {
    const extension = asset.fileName.split('.').reverse()[0];
    const { data: file, encryptedEntityKey } = await API.upload({
      file: {
        uri: asset.uri,
        base64: asset.base64,
        fileName: `${name}.${extension}`,
        type: asset.type,
      },
      path: `/person/${personDB._id}/document`,
    });
    await onUpdatePerson(true, {
      documents: [
        ...(personDB.documents || []),
        {
          _id: file.filename,
          name: file.originalname,
          encryptedEntityKey,
          createdAt: new Date(),
          createdBy: user._id,
          file,
        },
      ],
    });
    reset();
  };

  const reset = () => {
    setAsset(null);
    setName('');
  };

  return (
    <>
      <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Documents" />
      <ScrollContainer backgroundColor={backgroundColor || colors.app.color}>
        {(personDB?.documents || []).map((doc) => (
          <DocumentContainer key={doc.name}>
            <DocumentTitle>{doc.name}</DocumentTitle>
          </DocumentContainer>
        ))}
        <Button
          caption="Ajouter une photo"
          onPress={async () => {
            const permission = await getCameraPermission();
            if (!permission) {
              alertPhotosSetting(new Error('Access to camera was denied', 'camera'));
              return;
            }
            const result = await launchCamera({ mediaType: 'photo', includeBase64: true, saveToPhotos: true });
            handleSavePicture(result);
          }}
          disabled={updating}
          loading={updating}
        />
        <Spacer />
        <Button
          caption="Sélectionner une photo"
          onPress={async () => {
            const permission = await getPhotoLibraryPermission();
            if (!permission) {
              alertPhotosSetting(new Error('Access to photo library was denied', 'images'));
              return;
            }
            const result = await launchImageLibrary({ includeBase64: true, mediaType: 'photo' });
            handleSavePicture(result);
          }}
          disabled={updating}
          loading={updating}
        />
        <Hint>Il n'est pour l'instant pas possible de lire, télécharger ou supprimer un document depuis l'app - seulement depuis le dashboard.</Hint>
      </ScrollContainer>
      <Modal animationType="fade" visible={!!asset}>
        <SceneContainer>
          <ScreenTitle title="Donner un nom à cette photo" onBack={reset} />
          <ScrollContainer>
            <InputLabelled label="Nom" onChangeText={setName} value={name} placeholder="Nom" editable />
            <ButtonsContainer>
              <Button caption="Enregistrer" onPress={sendPictureToDB} disabled={!name.length} />
            </ButtonsContainer>
          </ScrollContainer>
        </SceneContainer>
      </Modal>
    </>
  );
};

const DocumentContainer = styled.TouchableOpacity`
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 16px;
  padding-horizontal: 20px;
  padding-vertical: 10px;
  align-self: center;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
  width: 100%;
  margin-bottom: 15px;
`;

const DocumentTitle = styled.Text`
  text-align: left;
`;

const Hint = styled.Text`
  font-size: 12px;
  margin-vertical: 15px;
  text-align: center;
`;

export default Documents;
