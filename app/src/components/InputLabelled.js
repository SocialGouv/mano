import React from 'react';
import styled from 'styled-components';
import Label from './Label';
import InputMultilineAutoAdjust from './InputMultilineAutoAdjust';

const InputLabelled = React.forwardRef(({ error, label, multiline, ...props }, ref) => (
  <InputContainer>
    {label && <Label label={label} />}
    {multiline ? <InputMultilineAutoAdjust ref={ref} {...props} /> : <Input ref={ref} {...props} />}
    <Error>{error}</Error>
  </InputContainer>
));

const InputContainer = styled.View`
  margin-bottom: 15px;
  flex-grow: 1;
`;

const Error = styled.Text`
  margin-left: 5px;
  font-size: 14px;
  color: red;
  height: 18px;
`;

const Input = styled.TextInput`
  border: 1px solid #666;
  border-radius: 8px;
  padding-horizontal: 15px;
  padding-vertical: 10px;
`;

export default InputLabelled;
