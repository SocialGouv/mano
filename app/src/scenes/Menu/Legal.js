import React from 'react';
import { Platform } from 'react-native';
import PdfViewer from '../../components/PdfViewer';

const Legal = () => <PdfViewer source={{ uri: 'https://dashboard-mano.fabrique.social.gouv.fr/legal.pdf' }} title="Mentions Légales" />;

export default Legal;
