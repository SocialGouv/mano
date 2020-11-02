import React from 'react';
import styled from 'styled-components';

const SceneContainer = ({ children, debug }) => <Container debug={debug}>{children}</Container>;

const Container = styled.View`
  flex: 1;
  background-color: #f5f6f6;
  ${(props) => props.debug && 'border: 3px solid #000;'}
`;

export default SceneContainer;
