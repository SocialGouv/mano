import React from 'react';
import styled from 'styled-components';
import { TouchableOpacity } from 'react-native';
import ResetIcon from '../icons/ResetIcon';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const ButtonReset = ({ onPress }) => (
  <ButtonContainer>
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop}>
      <Icon>
        <ResetIcon />
      </Icon>
    </TouchableOpacity>
  </ButtonContainer>
);

const ButtonContainer = styled.View`
  margin-left: auto;
  margin-right: -5px;
  flex-grow: 0;
  flex-shrink: 0;
`;

const iconSize = 20;
const Icon = styled.View`
  height: ${iconSize}px;
  width: ${iconSize}px;
`;

export default ButtonReset;
