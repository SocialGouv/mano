import React from 'react';
import { Platform } from 'react-native';
import PdfViewer from '../../components/PdfViewer';

const Privacy = () => (
  <PdfViewer source={{ uri: 'https://dashboard-mano.fabrique.social.gouv.fr/privacy.pdf' }} title="Politique de confidentialité" />
);

export default Privacy;
