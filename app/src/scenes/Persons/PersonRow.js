import React from 'react';
import styled from 'styled-components';
import ButtonRight from '../../components/ButtonRight';
import RowContainer from '../../components/RowContainer';

const PersonRow = ({ onPress, name, birthdate, buttonRight = '>' }) => {
  return (
    <RowContainer onPress={onPress}>
      <CaptionsContainer>
        <Name>{name}</Name>
        {birthdate && (
          <Birthdate>
            {new Date(birthdate).getBirthDate('fr')} ({new Date(birthdate).getAge('fr')})
          </Birthdate>
        )}
      </CaptionsContainer>
      <ButtonRight onPress={onPress} caption={buttonRight} />
    </RowContainer>
  );
};

const CaptionsContainer = styled.View`
  padding-vertical: 15px;
  margin-horizontal: 15px;
  flex-grow: 1;
  flex-direction: row;
  align-items: center;
`;

const Birthdate = styled.Text`
  font-style: italic;
  margin-left: auto;
`;

const Name = styled.Text`
  font-weight: bold;
  font-size: 20px;
`;

export default PersonRow;
