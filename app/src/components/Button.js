import React from 'react';
import styled from 'styled-components';
import { TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { MyText } from './MyText';
import colors from '../utils/colors';
import Spacer from './Spacer';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const Button = ({
  caption,
  onPress,
  disabled,
  outlined,
  borderColor,
  backgroundColor = null,
  color = colors.app.color,
  loading,
  fullWidth,
  Icon,
  noBorder = false,
  buttonSize = 40,
  testID = '',
}) => {
  const Root = loading !== undefined ? TouchableWithoutFeedback : TouchableOpacity;
  return (
    <Root onPress={onPress} disabled={disabled} hitSlop={hitSlop} testID={testID}>
      <ButtonContainer
        outlined={outlined}
        disabled={disabled}
        backgroundColor={backgroundColor}
        buttonSize={buttonSize}
        noBorder={noBorder}
        fullWidth={fullWidth}
        borderColor={borderColor}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <>
            {!!Icon && <Icon size={25} color={color} />}
            {!!Icon && !!caption && <Spacer height={10} />}
            {!!caption && (
              <Caption
                outlined={outlined}
                color={color}
                //  backgroundColor={backgroundColor}
              >
                {caption}
              </Caption>
            )}
          </>
        )}
      </ButtonContainer>
    </Root>
  );
};

const ButtonContainer = styled.View`
  /* background-color: ${(props) => (props.outlined ? 'white' : props.backgroundColor)};
  border-color: ${(props) => props.borderColor || props.backgroundColor}; */
  ${(props) => props.backgroundColor && `background-color: ${props.backgroundColor};`}
  border: 1px solid rgba(30, 36, 55, 0.1);
  border-radius: 16px;
  padding-horizontal: 20px;
  padding-vertical: ${(props) => props.buttonSize / 2}px;
  align-self: center;
  justify-content: center;
  align-items: center;
  justify-content: center;
  min-width: ${Math.min(Dimensions.get('window').width * 0.3, 140)}px;
  flex-direction: row;
  /* min-width: 140px; */
  ${(props) => props.disabled && 'opacity: 0.5;'}
  ${(props) => props.fullWidth && 'width: 100%;'}
  ${(props) => props.noBorder && 'border-width: 0;'}
`;

const Caption = styled(MyText)`
  color: ${(props) => props.color};
  align-items: center;
  justify-content: center;
  text-align: center;
`;

export default Button;
