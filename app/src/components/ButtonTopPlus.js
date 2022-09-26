import React from 'react';
import styled, { css } from 'styled-components';
import colors from '../utils/colors';
import { TouchableOpacity } from 'react-native';
import { MyText } from './MyText';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const ButtonTopPlus = ({ onPress, color = '#fff', left = false, disabled = false }) => (
  <ButtonContainer leftCss={left} disabled={disabled}>
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop}>
      <Icon>
        <Plus color={color}>+</Plus>
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
  ${(props) => (props.leftCss ? leftCss : rightCss)}
`;

const iconSize = 30;
const Icon = styled.View`
  height: ${iconSize}px;
  width: ${iconSize}px;
  border: 2px solid ${colors.app.color};
  border-radius: ${iconSize}px;
  background-color: ${colors.app.color};
`;

const Plus = styled(MyText)`
  align-self: center;
  font-weight: bold;
  font-size: ${iconSize - 2}px;
  line-height: ${iconSize}px;
  color: ${(props) => props.color};
  text-align: center;
`;

export default ButtonTopPlus;
