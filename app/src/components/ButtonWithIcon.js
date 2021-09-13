import React from 'react';
import styled from 'styled-components';
import { ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import EditIcon from '../icons/EditIcon';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const ButtonWithIcon = ({ onPress, color = '#fff', loading, children }) => {
  return (
    <ButtonContainer>
      <TouchableWithoutFeedback onPress={onPress} hitSlop={hitSlop}>
        <Icon>{loading ? <ActivityIndicator size="small" color={color} /> : children}</Icon>
      </TouchableWithoutFeedback>
    </ButtonContainer>
  );
};

const ButtonContainer = styled.View`
  flex-grow: 0;
  flex-shrink: 0;
`;

const iconSize = 30;
const Icon = styled.View`
  height: ${iconSize}px;
  width: ${iconSize}px;
  align-items: center;
  justify-content: center;
`;

export default ButtonWithIcon;
