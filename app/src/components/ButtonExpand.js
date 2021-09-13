import React from 'react';
import styled from 'styled-components';
import { TouchableWithoutFeedback } from 'react-native';
import ArrowRightIcon from '../icons/ArrowRightIcon';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const ButtonExpand = ({ onPress, color = '#888', expanded }) => {
  return (
    <ButtonContainer>
      <TouchableWithoutFeedback onPress={onPress} hitSlop={hitSlop}>
        <Icon expanded={expanded}>
          <ArrowRightIcon color={color} size={15} />
        </Icon>
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
  transform: rotate(${(props) => (props.expanded ? 90 : 0)}deg);
  align-items: center;
  justify-content: center;
`;

export default ButtonExpand;
