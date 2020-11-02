import React from 'react';
import styled from 'styled-components';
import { ActivityIndicator } from 'react-native';

const Spinner = () => (
  <SpinnerContainer>
    <ActivityIndicator size="large" color="#000" />
  </SpinnerContainer>
);

const SpinnerContainer = styled.View`
  flex: 1;
  height: 100%;
  justify-content: center;
`;

export default Spinner;
