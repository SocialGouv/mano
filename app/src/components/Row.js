import React from 'react';
import styled from 'styled-components';
import ButtonRight from './ButtonRight';
import RowContainer from './RowContainer';

const Row = ({ onPress, Icon, caption, withNextButton }) => (
  <RowContainer onPress={onPress}>
    <Caption>{caption}</Caption>
    {withNextButton && <ButtonRight onPress={onPress} caption=">" />}
  </RowContainer>
);

const iconSize = 30;
const IconContainer = styled.View`
  height: ${iconSize}px;
  width: ${iconSize}px;
  border-radius: ${iconSize}px;
  border-color: #888;
  ${(props) => props.visible && 'border-width: 1px;'}
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

const Caption = styled.Text`
  margin-left: 15px;
  font-size: 20px;
  font-weight: bold;
`;

export default Row;
