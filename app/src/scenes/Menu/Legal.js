import React from 'react';
import { Platform } from 'react-native';
import PdfViewer from '../../components/PdfViewer';

const Legal = () => (
  <PdfViewer
    source={Platform.select({
      ios: require('../../assets/legal.pdf'),
      android: { uri: 'bundle-assets://legal.pdf' }, // android/app/src/main/assets/
    })}
    title="Mentions Légales"
  />
);

export default Legal;
