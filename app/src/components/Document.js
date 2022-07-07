import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import styled from 'styled-components';
import API from '../services/api';
import FileViewer from "react-native-file-viewer";

const Document = ({ personId, document }) => {
  console.log(document);
  /*
  useEffect(() => {
    API.download({
      path: `/person/${personId}/document/${document.file.filename}`,
      encryptedEntityKey: document.encryptedEntityKey,
    }).then((e) => {
      console.log('download done', e.substring(0, 10));
    });
  }, [personId, document]);
  */
  return (
    <DocumentContainer
      onPress={() => {
        API.download({
          path: `/person/${personId}/document/${document.file.filename}`,
          encryptedEntityKey: document.encryptedEntityKey,
        }).then(({ decrypted, path }) => {
          console.log('download done', path);
          FileViewer.open(path) // absolute-path-to-my-local-file.
            .then((f) => {
              console.log('FileViewer opened', f);
            })
            .catch((error) => {
              console.log('FileViewer opened', error);
            });
        });
      }}
      key={document.name}>
      <DocumentTitle>{document.name}</DocumentTitle>
      <ImageStyled source={require('../assets/MANO_livraison_elements-04.png')} />
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

const ImageStyled = styled.Image`
  width: ${Dimensions.get('window').width * 0.7}px;
  height: ${Dimensions.get('window').width * 0.7}px;
`;

export default Document;
