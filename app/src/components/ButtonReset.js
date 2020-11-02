import React from 'react';
import styled from 'styled-components';
import { TouchableOpacity } from 'react-native';
import ResetIcon from '../icons/ResetIcon';

const ButtonReset = ({ onPress }) => (
  <ButtonContainer>
    <TouchableOpacity onPress={onPress}>
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

const Cross = styled.Text`
  align-self: center;
  font-size: ${iconSize - 4}px;
  line-height: ${iconSize - 2}px;
  color: #fff;
  text-align: center;
`;

export default ButtonReset;
