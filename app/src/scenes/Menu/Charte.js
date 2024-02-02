import React from 'react';
import PdfViewer from '../../components/PdfViewer';

const Charte = () => <PdfViewer source={{ uri: 'https://espace-mano.sesan.fr/charte.pdf' }} title="Charte des utilisateurs" />;

export default Charte;
