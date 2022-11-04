import React, { useState } from 'react';
import styled from 'styled-components';
import { Text, Alert } from 'react-native';
import API from '../services/api';
import FileViewer from 'react-native-file-viewer';
import { connectActionSheet } from '@expo/react-native-action-sheet';

const Document = ({ showActionSheetWithOptions, personId, document, onDelete }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onMorePress = async () => {
    const options = ['Supprimer', 'Annuler'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.findIndex((option) => option === 'Annuler'),
        destructiveButtonIndex: options.findIndex((option) => option === 'Supprimer'),
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Supprimer') {
          Alert.alert('Voulez-vous vraiment supprimer ce document ?', null, [
            {
              text: 'Annuler',
              style: 'cancel',
            },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: async () => {
                setIsDeleting(true);
                await API.delete({ path: `/person/${personId}/document/${document.file.filename}` });
                onDelete(document);
                setIsDeleting(false);
              },
            },
          ]);
        }
      }
    );
  };

  return (
    <DocumentContainer
      onLongPress={onMorePress}
      onPress={() => {
        if (isDownloading) return;
        setIsDownloading(true);
        API.download({
          path: `/person/${personId}/document/${document.file.filename}`,
          encryptedEntityKey: document.encryptedEntityKey,
          document,
        }).then(({ path }) => {
          FileViewer.open(path)
            .then((f) => {
              setIsDownloading(false);
            })
            .catch((error) => {
              setIsDownloading(false);
            });
        });
      }}
      key={document.name + document.createdAt}>
      {!!isDownloading && <Text>Chargement du document chiffré, veuillez patienter</Text>}
      {!!isDeleting && <Text>Suppression du document, veuillez patienter</Text>}
      {!isDeleting && !isDownloading && <DocumentTitle>{document.name}</DocumentTitle>}
    </DocumentContainer>
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
  flex-direction: column;
  align-self: stretch;
  margin-bottom: 15px;
`;

const DocumentTitle = styled.Text`
  text-align: left;
`;
export default connectActionSheet(Document);
