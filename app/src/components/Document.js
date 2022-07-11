import React, { useState } from 'react';
import styled from 'styled-components';
import { Text } from 'react-native';
import API from '../services/api';
import FileViewer from 'react-native-file-viewer';

const Document = ({ personId, document }) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <DocumentContainer
      onPress={() => {
        if (isLoading) return;
        setIsLoading(true);
        API.download({
          path: `/person/${personId}/document/${document.file.filename}`,
          encryptedEntityKey: document.encryptedEntityKey,
          document,
        }).then(({ path }) => {
          FileViewer.open(path)
            .then((f) => {
              setIsLoading(false);
            })
            .catch((error) => {
              setIsLoading(false);
            });
        });
      }}
      key={document.name}>
      {isLoading ? <Text>Chargement du document chiffré, veuillez patienter</Text> : <DocumentTitle>{document.name}</DocumentTitle>}
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
export default Document;
