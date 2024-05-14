import React, { useState } from 'react';
import { Alert, Modal } from 'react-native';
import styled from 'styled-components/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useRecoilValue } from 'recoil';
import ScrollContainer from './ScrollContainer';
import Button from './Button';
import API from '../services/api';
import { capture } from '../services/sentry';
import { userState } from '../recoil/auth';
import { alertPhotosSetting, getCameraPermission, getPhotoLibraryPermission } from '../services/permissions-photo';
import SceneContainer from './SceneContainer';
import ScreenTitle from './ScreenTitle';
import InputLabelled from './InputLabelled';
import ButtonsContainer from './ButtonsContainer';
import Document from './Document';
import { useActionSheet } from '@expo/react-native-action-sheet';
import DocumentPicker, { isInProgress } from 'react-native-document-picker';
const RNFS = require('react-native-fs');

const DocumentsManager = ({ personDB, documents = [], onAddDocument, onDelete }) => {
  const user = useRecoilValue(userState);
  const [asset, setAsset] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showActionSheetWithOptions } = useActionSheet();

  const onAddPress = async () => {
    const options = ['Prendre une photo', "Bibliothèque d'images", 'Naviguer dans les documents', 'Annuler'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.findIndex((option) => option === 'Annuler'),
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Prendre une photo') {
          setLoading('camera');
          const permission = await getCameraPermission();
          if (!permission) {
            alertPhotosSetting(new Error('Access to camera was denied', 'camera'));
            reset();
            return;
          }
          const result = await launchCamera({ mediaType: 'photo', includeBase64: true, saveToPhotos: true });
          handleSavePicture(result);
        }
        if (options[buttonIndex] === "Bibliothèque d'images") {
          setLoading('photoLibrary');
          const permission = await getPhotoLibraryPermission();
          if (!permission) {
            alertPhotosSetting(new Error('Access to photo library was denied', 'images'));
            reset();
            return;
          }
          const result = await launchImageLibrary({ includeBase64: true, mediaType: 'photo' });
          handleSavePicture(result);
        }
        if (options[buttonIndex] === 'Naviguer dans les documents') {
          setLoading('documents');
          try {
            const document = await DocumentPicker.pickSingle();
            //   { "name": "Adobe Scan 19 janv. 2023.pdf",
            //   "size": 222133, "type":
            //   "application/pdf",
            //   "uri": "content://com.adobe.scan.android.documents/document/root%3A1"
            // }
            const base64 = await RNFS.readFile(document.uri, 'base64');

            setAsset({
              ...document,
              type: 'document',
              fileName: document.name,
              base64,
            });
            setName(document.name.replace(`.${document.name.split('.').reverse()[0]}`, '')); // remove extension
          } catch (docError) {
            if (DocumentPicker.isCancel(docError)) return;
            if (isInProgress(docError)) return; // multiple pickers were opened, only the last will be considered
            Alert.alert('Désolé, une erreur est survenue', "L'équipe technique a été prévenue");
            capture(docError, { extra: { message: 'error uploading document' } });
            reset();
          }
        }
      }
    );
  };

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

  const sendToDB = async () => {
    setLoading('sending');
    if (!asset) {
      Alert.alert('Désolé, une erreur est survenue', "Veuillez réessayer d'enregistrer votre document");
      reset();
      return;
    }
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
    if (!file) {
      Alert.alert('Désolé, une erreur est survenue', "Veuillez réessayer d'enregistrer votre document");
      reset();
      return;
    }
    await onAddDocument({
      _id: file.filename,
      name: file.originalname,
      encryptedEntityKey,
      createdAt: new Date(),
      createdBy: user._id,
      downloadPath: `/person/${personDB._id}/document/${file.filename}`,
      file,
    });
    reset();
  };

  const reset = () => {
    setAsset(null);
    setLoading(null);
    setName('');
  };

  const onlyDocuments = documents.filter((doc) => doc.type !== 'folder');

  return (
    <>
      {onlyDocuments.length > 0 && <Hint>Cliquez sur un document pour le consulter</Hint>}
      {onlyDocuments.map((doc) => (
        <Document key={doc.name} document={doc} personId={personDB._id} onDelete={onDelete} />
      ))}
      <Button caption="Ajouter..." disabled={!!loading} loading={!!loading} onPress={onAddPress} />
      <Modal animationType="fade" visible={!!asset}>
        <SceneContainer>
          <ScreenTitle title="Donner un nom à cette photo" onBack={reset} />
          <ScrollContainer>
            <InputLabelled label="Nom" onChangeText={setName} value={name} placeholder="Nom" editable />
            <ButtonsContainer>
              <Button caption="Enregistrer" onPress={sendToDB} disabled={!name.length} loading={loading === 'sending'} />
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
