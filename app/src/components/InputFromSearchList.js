import React from 'react';
import styled from 'styled-components';
import Label from './Label';
import ButtonRight from './ButtonRight';
import InputLabelled from './InputLabelled';
import { MyText } from './MyText';

const InputFromSearchList = ({
  error,
  label,
  onSearchRequest,
  value,
  disabled,
  editable = true,
}) => {
  if (!editable) {
    return <InputLabelled label="Personne concernée" value={value} editable={false} />;
  }
  return (
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
};

const InputContainer = styled.View`
  margin-bottom: 15px;
`;

const InputSubContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 12px;
  padding-horizontal: 12px;
  padding-vertical: 8px;
  min-height: 50px;
`;

const ButtonContainer = styled.View``;

const Error = styled(MyText)`
  margin-left: 5px;
  font-size: 14px;
  color: red;
  height: 18px;
`;

const Input = styled(MyText)`
  flex-grow: 1;
`;

export default InputFromSearchList;
