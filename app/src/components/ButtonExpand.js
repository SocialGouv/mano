import React from 'react';
import styled from 'styled-components';
import { TouchableWithoutFeedback } from 'react-native';
import ArrowRightIcon from '../icons/ArrowRightIcon';

const ButtonExpand = ({ onPress, color = '#888', expanded }) => {
  return (
    <ButtonContainer>
      <TouchableWithoutFeedback onPress={onPress}>
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

const Next = styled.Text`
  align-self: center;
  font-size: ${iconSize - 4}px;
  line-height: ${iconSize - 1}px;
  color: ${(props) => props.color};
  text-align: center;
`;

export default ButtonExpand;
