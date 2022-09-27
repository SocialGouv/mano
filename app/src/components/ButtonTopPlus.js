import React from 'react';
import styled from 'styled-components';
import colors from '../utils/colors';
import { MyText } from './MyText';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const ButtonTopPlus = ({ onPress, color = '#fff', left = false, disabled = false }) => (
  <ButtonContainer disabled={disabled} onPress={onPress} hitSlop={hitSlop}>
    <Plus color={color}>+</Plus>
  </ButtonContainer>
);

const iconSize = 30;
const ButtonContainer = styled.TouchableOpacity`
  height: ${iconSize}px;
  width: ${iconSize}px;
  /* border: 1px solid ${colors.app.color}; */
  border-radius: ${iconSize}px;
  justify-content: center;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0.5;
  margin-bottom: auto;
`;

const Plus = styled(MyText)`
  align-self: center;
  font-size: ${iconSize - 2}px;
  line-height: ${(iconSize - 3) * 1.5}px;
  height: ${iconSize}px;
  width: ${iconSize}px;
  color: ${colors.app.color};
  text-align: center;
  justify-content: center;
  align-items: center;
`;

export default ButtonTopPlus;
