import React from 'react';
import { Platform } from 'react-native';
import PdfViewer from '../../components/PdfViewer';

const Privacy = () => (
  <PdfViewer
    source={Platform.select({
      ios: require('../../assets/privacy.pdf'),
      android: { uri: 'bundle-assets://privacy.pdf' }, // android/app/src/main/assets/
    })}
    title="Politique de confidentialité"
  />
);

export default Privacy;
