import React from 'react';
import styled from 'styled-components';

const Spacer = ({ height }) => <ButtonContainer spacerHeight={height} />;

const ButtonContainer = styled.View`
  flex-shrink: 1;
  height: ${(props) => props.spacerHeight}px;
`;

export default Spacer;
