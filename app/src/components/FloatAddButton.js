import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components';
import { Plus } from '../icons';
import colors from '../utils/colors';

const FloatAddButton = ({ onPress, color = colors.app.secondary, testID }) => {
  return (
    <TouchableWithoutFeedback onPress={onPress} testID={testID}>
      <Button color={color}>
        <Plus name="add" size={20} color="white" />
      </Button>
    </TouchableWithoutFeedback>
  );
};

const size = 60;
const Button = styled.View`
  position: absolute;
  bottom: 15px;
  right: 25px;
  z-index: 1000;
  height: ${size}px;
  width: ${size}px;
  border-radius: ${size}px;
  background-color: ${(props) => props.color};
  justify-content: center;
  align-items: center;
`;

export default FloatAddButton;
