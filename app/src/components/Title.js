import React from 'react';
import styled from 'styled-components';
import { MyText } from './MyText';

const Title = ({ children, left }) => (
  <TitleStyled heavy left={left}>
    {children}
  </TitleStyled>
);

const TitleStyled = styled(MyText)`
  padding-horizontal: 30px;
  padding-vertical: 15px;
  font-weight: bold;
  font-size: 30px;
  margin-top: 30%;
  align-self: ${(props) => (props.left ? 'flex-start' : 'center')};
`;

export const SubTitle = styled(MyText)`
  font-size: 13px;
  margin-top: 2%;
  margin-bottom: 15%;
  align-self: center;
  text-align: center;
  opacity: 0.75;
`;

export default Title;
