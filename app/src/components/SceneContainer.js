import React from 'react';
import styled from 'styled-components';
import { Platform } from 'react-native';
import colors from '../utils/colors';

const SceneContainer = ({ children, debug, enabled = true, backgroundColor = colors.app.color, testID = '' }) => (
  <KeyboardAvoidingView
    enabled={enabled}
    debug={debug}
    // keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
    behavior={Platform.select({ ios: 'padding', android: null })}>
    <Container testID={testID} backgroundColor={backgroundColor} debug={debug}>
      {children}
    </Container>
  </KeyboardAvoidingView>
);

const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.backgroundColor};
  ${(props) => props.debug && 'border: 3px solid #000;'}
`;

const KeyboardAvoidingView = styled.KeyboardAvoidingView`
  flex: 1;
  background-color: #fff;
  ${(props) => props.debug && 'border: 3px solid #f00;'}
`;

export default SceneContainer;
