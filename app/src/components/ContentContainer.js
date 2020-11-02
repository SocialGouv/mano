import React from 'react';
import styled from 'styled-components';

const ContentContainer = ({ children, debug }) => <Container debug={debug}>{children}</Container>;

const Container = styled.View`
  flex: 1;
  padding: 30px;
  ${(props) => props.debug && 'border: 3px solid #000;'}
`;

export default ContentContainer;
