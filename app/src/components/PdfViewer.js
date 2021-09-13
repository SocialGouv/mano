import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { Dimensions, Linking } from 'react-native';

import Pdf from 'react-native-pdf';
import styled from 'styled-components';
import SceneContainer from './SceneContainer';
import ScreenTitle from './ScreenTitle';

/*

source example

Platform.select({
  ios: require('./PdfViewer.pdf'),
  android: { uri: 'bundle-assets://PdfViewer.pdf' }, // android/app/src/main/assets/
})

 */
const PdfViewer = ({ title, source, noHeader = false }) => {
  const navigation = useNavigation();
  if (noHeader) {
    return (
      <Pdf
        source={source}
        onPressLink={(url) => {
          if (Linking.canOpenURL(url)) Linking.openURL(url);
        }}
      />
    );
  }
  return (
    <SceneContainer>
      <ScreenTitle title={title} onBack={navigation.goBack} />
      <Container>
        <PdfStyled
          source={source}
          onPressLink={(url) => {
            if (Linking.canOpenURL(url)) Linking.openURL(url);
          }}
        />
      </Container>
    </SceneContainer>
  );
};

const Container = styled.View`
  flex: 1;
  justify-content: flex-start;
  align-items: center;
`;

const PdfStyled = styled(Pdf)`
  flex: 1;
  width: ${Dimensions.get('window').width}px;
  height: ${Dimensions.get('window').height}px;
`;

export default PdfViewer;
