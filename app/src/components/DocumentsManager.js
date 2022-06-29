import React, { useState } from 'react';
import { Alert, Modal } from 'react-native';
import styled from 'styled-components';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useRecoilValue } from 'recoil';
import ScrollContainer from './ScrollContainer';
import Button from './Button';
import API from '../services/api';
import { capture } from '../services/sentry';
import { userState } from '../recoil/auth';
import Spacer from './Spacer';
import { alertPhotosSetting, getCameraPermission, getPhotoLibraryPermission } from '../services/permissions-photo';
import SceneContainer from './SceneContainer';
import ScreenTitle from './ScreenTitle';
import InputLabelled from './InputLabelled';
import ButtonsContainer from './ButtonsContainer';
import Document from './Document';

const DocumentsManager = ({ personDB, documents = [], onAddDocument }) => {
  const user = useRecoilValue(userState);
  const [asset, setAsset] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState('');
  const handleSavePicture = async (result) => {
    if (result.didCancel) return reset();
    if (result.errorCode) {
      Alert.alert('Désolé, une erreur est survenue', "L'équipe technique a été prévenue");
      capture('error selecting picture from library', { extra: { result } });
      reset();
      return;
    }
    setAsset(result.assets[0]);
  };

  const sendPictureToDB = async () => {
    setLoading('sending');
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
    await onAddDocument({
      _id: file.filename,
      name: file.originalname,
      encryptedEntityKey,
      createdAt: new Date(),
      createdBy: user._id,
      file,
    });
    reset();
  };

  const reset = () => {
    setAsset(null);
    setLoading(null);
    setName('');
  };

  return (
    <>
      <Button
        caption="Ajouter une photo"
        disabled={!!loading}
        loading={loading === 'camera'}
        onPress={async () => {
          setLoading('camera');
          const permission = await getCameraPermission();
          if (!permission) {
            alertPhotosSetting(new Error('Access to camera was denied', 'camera'));
            reset();
            return;
          }
          const result = await launchCamera({ mediaType: 'photo', includeBase64: true, saveToPhotos: true });
          handleSavePicture(result);
        }}
      />
      <Spacer />
      <Button
        caption="Sélectionner une photo"
        disabled={!!loading}
        loading={loading === 'images'}
        onPress={async () => {
          setLoading('images');
          const permission = await getPhotoLibraryPermission();
          if (!permission) {
            alertPhotosSetting(new Error('Access to photo library was denied', 'images'));
            reset();
            return;
          }
          const result = await launchImageLibrary({ includeBase64: true, mediaType: 'photo' });
          handleSavePicture(result);
        }}
      />
      <Hint>Il n'est pour l'instant pas possible de lire, télécharger ou supprimer un document depuis l'app - seulement depuis le dashboard.</Hint>
      {documents.map((doc) => (
        <Document key={doc.name} document={doc} />
      ))}
      <Modal animationType="fade" visible={!!asset}>
        <SceneContainer>
          <ScreenTitle title="Donner un nom à cette photo" onBack={reset} />
          <ScrollContainer>
            <InputLabelled label="Nom" onChangeText={setName} value={name} placeholder="Nom" editable />
            <ButtonsContainer>
              <Button caption="Enregistrer" onPress={sendPictureToDB} disabled={!name.length} loading={loading === 'sending'} />
            </ButtonsContainer>
          </ScrollContainer>
        </SceneContainer>
      </Modal>
    </>
  );
};

const Hint = styled.Text`
  font-size: 12px;
  margin-vertical: 15px;
  text-align: center;
`;

export default DocumentsManager;
