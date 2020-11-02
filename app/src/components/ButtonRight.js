import React from 'react';
import styled from 'styled-components';
import { TouchableOpacity } from 'react-native';

const ButtonRight = ({ onPress, caption, color = '#888' }) => (
  <ButtonContainer>
    <TouchableOpacity onPress={onPress}>
      <Icon>
        <Next color={color}>{caption}</Next>
      </Icon>
    </TouchableOpacity>
  </ButtonContainer>
);

const ButtonContainer = styled.View`
  margin-left: auto;
  flex-grow: 0;
  flex-shrink: 0;
`;

const iconSize = 30;
const Icon = styled.View`
  height: ${iconSize}px;
  width: ${iconSize}px;
`;

const Next = styled.Text`
  align-self: center;
  font-size: ${iconSize - 4}px;
  line-height: ${iconSize - 1}px;
  color: ${(props) => props.color};
  text-align: center;
`;

export default ButtonRight;
