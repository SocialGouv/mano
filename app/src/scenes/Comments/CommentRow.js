import React from 'react';
import styled from 'styled-components';
import ButtonRight from '../../components/ButtonRight';
import { TouchableOpacity } from 'react-native';

const CommentRow = ({ onPress, comment, createdAt, userName }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Container>
        <CaptionsContainer>
          <Comment>{comment}</Comment>
          <CreationDate>
            {`${userName ? `${userName} - ` : ''}${new Date(createdAt).getLocaleDate('fr')}`}
          </CreationDate>
        </CaptionsContainer>
        <ButtonRight onPress={onPress} caption=">" />
      </Container>
    </TouchableOpacity>
  );
};

const Container = styled.View`
  border-bottom-color: #ddd;
  border-bottom-width: 1px;
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

const CaptionsContainer = styled.View`
  padding-vertical: 5px;
  padding-left: 35px;
  flex-grow: 1;
  flex-basis: 100%;
  align-items: flex-start;
`;

const Comment = styled.Text`
  font-size: 20px;
  margin-right: 35px;
  padding-right: 35px;
  margin-bottom: 5px;
  flex-grow: 1;
`;

const CreationDate = styled.Text`
  font-style: italic;
  margin-left: auto;
  margin-right: 45px;
`;

export default CommentRow;
