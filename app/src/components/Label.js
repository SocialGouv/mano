import React from 'react';
import styled from 'styled-components';
import { MyText } from './MyText';

const Label = ({ label, big }) => (
  <LabelStyled big={big} bold debug>
    {label}
  </LabelStyled>
);

const LabelStyled = styled(MyText)`
  margin-bottom: 10px;
  font-weight: bold;
  ${(props) => props.big && 'font-size: 17px;'}
`;

export default Label;
