import React from 'react';
import styled from 'styled-components';
import { TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Dimensions } from 'react-native';

const Button = ({ caption, onPress, disabled, outlined, borderColor, backgroundColor = 'green', color = 'white', loading, style = {} }) => {
  const Root = loading !== undefined ? TouchableWithoutFeedback : TouchableOpacity;
  return (
    <Root onPress={onPress} disabled={disabled}>
      <ButtonContainer outlined={outlined} disabled={disabled} backgroundColor={backgroundColor} style={style} borderColor={borderColor}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Caption outlined={outlined} color={color} backgroundColor={backgroundColor}>
            {caption}
          </Caption>
        )}
      </ButtonContainer>
    </Root>
  );
};

const buttonSize = 40;
const ButtonContainer = styled.View`
  background-color: ${(props) => (props.outlined ? 'white' : props.backgroundColor)};
  border-color: ${(props) => props.borderColor || props.backgroundColor};
  border-width: 1px;
  height: ${buttonSize}px;
  border-radius: ${buttonSize}px;
  padding-horizontal: ${buttonSize / 2}px;
  align-self: center;
  justify-content: center;
  min-width: ${Math.min(Dimensions.get('window').width * 0.3, 140)}px;
  /* min-width: 140px; */
  ${(props) => props.disabled && 'opacity: 0.5;'}
`;

const Caption = styled.Text`
  font-weight: bold;
  color: ${(props) => (props.outlined ? props.backgroundColor : props.color)};
  align-items: center;
  justify-content: center;
  text-align: center;
`;

export default Button;
