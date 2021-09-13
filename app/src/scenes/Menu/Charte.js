import React from 'react';
import { Platform } from 'react-native';
import PdfViewer from '../../components/PdfViewer';

const Charte = () => (
  <PdfViewer
    source={Platform.select({
      ios: require('../../assets/charte.pdf'),
      android: { uri: 'bundle-assets://charte.pdf' }, // android/app/src/main/assets/
    })}
    title="Charte des utilisateurs"
  />
);

export default Charte;
