import React from 'react';
import PdfViewer from '../../components/PdfViewer';

const Charte = () => <PdfViewer source={{ uri: 'https://dashboard-mano.fabrique.social.gouv.fr/charte.pdf' }} title="Charte des utilisateurs" />;

export default Charte;
