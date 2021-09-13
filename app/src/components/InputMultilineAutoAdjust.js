import React from 'react';
import styled from 'styled-components';
import { MyTextInput } from './MyText';

const InputMultilineAutoAdjust = React.forwardRef((props, ref) => {
  return (
    <InputContainer ref={ref}>
      <Input {...props} multiline />
    </InputContainer>
  );
});

const InputContainer = styled.View`
  flex-grow: 1;
  flex-shrink: 1;
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 12px;
  padding-horizontal: 12px;
  padding-top: 10px;
  padding-bottom: 15px;
`;

const Input = styled(MyTextInput)`
  flex-grow: 1;
  align-items: flex-start;
  text-align-vertical: top;
`;

export default InputMultilineAutoAdjust;
