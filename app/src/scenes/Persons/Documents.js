import React from 'react';
import { Alert } from 'react-native';
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

const Documents = ({ editable, updating, personDB, navigation, onUpdatePerson, onEdit, isUpdateDisabled, backgroundColor }) => {
  const user = useRecoilValue(userState);
  const handleSavePicture = async (result) => {
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Désolé, une erreur est survenue', "L'équipe technique a été prévenue");
      capture('error selecting picture from library', { extra: { result } });
    }
    const asset = result.assets[0];
    const { data: file, encryptedEntityKey } = await API.upload({
      file: {
        uri: asset.uri,
        base64: asset.base64,
        fileName: asset.fileName,
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
  };

  return (
    <>
      <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Documents" />
      <ScrollContainer backgroundColor={backgroundColor || colors.app.color}>
        {(personDB?.documents || []).map((doc) => (
          <DocumentContainer>
            <DocumentTitle>{doc.name}</DocumentTitle>
          </DocumentContainer>
        ))}
        <Button
          caption="Ajouter une photo"
          onPress={async () => {
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
            const result = await launchImageLibrary({ includeBase64: true, mediaType: 'photo' });
            handleSavePicture(result);
          }}
          disabled={updating}
          loading={updating}
        />
      </ScrollContainer>
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

export default Documents;
