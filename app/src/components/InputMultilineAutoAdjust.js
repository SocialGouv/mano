import React from 'react';
import styled from 'styled-components';

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
`;

const Input = styled.TextInput`
  flex-grow: 1;
  border: 1px solid #666;
  border-radius: 8px;
  padding-horizontal: 15px;
  padding-vertical: 10px;
  align-items: flex-start;
  text-align-vertical: top;
`;

export default InputMultilineAutoAdjust;
