import React from 'react';
import styled from 'styled-components';

const Document = ({ document }) => (
  <DocumentContainer key={document.name}>
    <DocumentTitle>{document.name}</DocumentTitle>
  </DocumentContainer>
);

const DocumentContainer = styled.TouchableOpacity`
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 16px;
  padding-horizontal: 20px;
  padding-vertical: 10px;
  align-self: center;
  justify-content: flex-start;
  align-items: center;
  flex-direction: row;
  align-self: stretch;
  margin-bottom: 15px;
`;

const DocumentTitle = styled.Text`
  text-align: left;
`;

export default Document;
