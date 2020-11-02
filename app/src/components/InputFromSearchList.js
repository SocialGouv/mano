import React from 'react';
import styled from 'styled-components';
import Label from './Label';
import ButtonRight from './ButtonRight';

const InputFromSearchList = ({ error, label, onSearchRequest, value, disabled }) => (
  <InputContainer>
    {label && <Label label={label} />}
    <InputSubContainer onPress={onSearchRequest} disabled={disabled}>
      <Input>{value}</Input>
      {!disabled && (
        <ButtonContainer>
          <ButtonRight caption=">" onPress={onSearchRequest} />
        </ButtonContainer>
      )}
    </InputSubContainer>
    <Error>{error}</Error>
  </InputContainer>
);

const InputContainer = styled.View`
  margin-bottom: 15px;
`;

const InputSubContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  border: 1px solid #666;
  border-radius: 8px;
  padding-horizontal: 15px;
  padding-vertical: 10px;
`;

const ButtonContainer = styled.View``;

const Error = styled.Text`
  margin-left: 5px;
  font-size: 14px;
  color: red;
  height: 18px;
`;

const Input = styled.Text`
  flex-grow: 1;
`;

export default InputFromSearchList;
