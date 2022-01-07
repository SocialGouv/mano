import React from 'react';
import { compose } from 'recompose';
import styled from 'styled-components';
import ScrollContainer from '../../components/ScrollContainer';
import SubHeader from '../../components/SubHeader';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import colors from '../../utils/colors';
import withContext from '../../contexts/withContext';
import PersonsContext from '../../contexts/persons';
import Spacer from '../../components/Spacer';

const Documents = ({ editable, updating, documents, navigation, onUpdatePerson, onEdit, isUpdateDisabled, backgroundColor }) => {
  return (
    <>
      <SubHeader center backgroundColor={backgroundColor || colors.app.color} onBack={navigation.goBack} caption="Dossier social" />
      <ScrollContainer backgroundColor={backgroundColor || colors.app.color}>
        {documents.map((document) => (
          <Document key={document._id} document={document} />
        ))}
        <Spacer />
        <ButtonsContainer>
          <Button
            caption="Prendre une photo"
            onPress={editable ? onUpdatePerson : onEdit}
            disabled={editable ? isUpdateDisabled() : false}
            loading={updating}
          />
        </ButtonsContainer>
      </ScrollContainer>
    </>
  );
};

export default compose(withContext(PersonsContext))(Documents);

const getType = (mimeType = '') => {
  if (mimeType.includes('image')) return 'Image';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('csv')) return 'csv';
  if (mimeType.includes('xls')) return 'xls';
  return mimeType;
};

const Document = ({ document }) => {
  console.log(document);
  return (
    <Container>
      <Title>{document.name}</Title>
      <Type>{getType(document.file.mimetype)}</Type>
    </Container>
  );
};

const Container = styled.TouchableOpacity`
  padding-vertical: 20px;
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 16px;
  padding-horizontal: 20px;
  flex-direction: row;
  justify-content: space-between;
`;

const Title = styled.Text``;
const Type = styled.Text`
  font-style: italic;
  color: ${colors.app.color};
`;
