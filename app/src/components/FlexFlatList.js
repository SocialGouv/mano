import React from 'react';
import styled from 'styled-components';

const FlexFlatList = ({ debug, ...props }) => <FlatListStyled debug={debug} {...props} />;

const FlatListStyled = styled.FlatList`
  border: 3px solid #000;
`;

export default FlexFlatList;
