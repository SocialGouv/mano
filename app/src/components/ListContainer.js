import React from 'react';
import styled from 'styled-components';

const ListContainer = ({ children, debug }) => <Container debug={debug}>{children}</Container>;

const Container = styled.ScrollView`
  flex: 1;
  ${(props) => props.debug && 'border: 3px solid #000;'}
`;

export default ListContainer;
