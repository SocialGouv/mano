import React from 'react';
import styled from 'styled-components';

const Spacer = ({ height = 20, grow }) => <ButtonContainer height={height} grow={grow} />;

const ButtonContainer = styled.View`
  /* flex-shrink: 1; */
  height: ${(props) => props.height}px;
  width: ${(props) => props.height}px;
  ${(props) => props.grow && 'flex-grow: 1;'}
`;

export default Spacer;
