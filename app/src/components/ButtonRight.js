import React from 'react';
import styled, { css } from 'styled-components';
import { TouchableOpacity } from 'react-native';
import { MyText } from './MyText';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const ButtonRight = ({ onPress, caption, color = '#888', left = false, disabled = false }) => (
  <ButtonContainer leftCss={left} disabled={disabled}>
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop}>
      <Icon>
        <Next color={color}>{caption}</Next>
      </Icon>
    </TouchableOpacity>
  </ButtonContainer>
);

const leftCss = css`
  margin-right: auto;
`;

const rightCss = css`
  margin-left: auto;
`;

const ButtonContainer = styled.View`
  margin-left: auto;
  flex-grow: 0;
  flex-shrink: 0;
  ${(props) => (props.leftCss ? leftCss : rightCss)}
`;

const iconSize = 30;
const Icon = styled.View`
  height: ${iconSize}px;
  width: ${iconSize}px;
`;

const Next = styled(MyText)`
  align-self: center;
  font-size: ${iconSize - 4}px;
  line-height: ${iconSize - 1}px;
  color: ${(props) => props.color};
  text-align: center;
`;

export default ButtonRight;
