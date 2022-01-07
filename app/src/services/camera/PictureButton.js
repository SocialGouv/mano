import React from 'react';
import styled from 'styled-components';
import { TouchableWithoutFeedback } from 'react-native';

const PictureButton = ({ size, onPress }) => (
  <TouchableWithoutFeedback onPress={onPress}>
    <OutsideCircle size={size}>
      <InsideCircle size={size} />
    </OutsideCircle>
  </TouchableWithoutFeedback>
);

const OutsideCircle = styled.View`
  height: ${(props) => props.size}px;
  width: ${(props) => props.size}px;
  border-radius: ${(props) => props.size}px;
  background-color: #000000;
  border-color: #ffffff;
  border-width: ${(props) => props.size / 15}px;
  justify-content: center;
  align-items: center;
`;

const InsideCircle = styled.View`
  height: ${(props) => props.size * 0.75}px;
  width: ${(props) => props.size * 0.75}px;
  border-radius: ${(props) => props.size * 0.75}px;
  background-color: #ffffff;
`;

export default PictureButton;
