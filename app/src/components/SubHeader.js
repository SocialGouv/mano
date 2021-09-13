import React from 'react';
import styled from 'styled-components';
import { View } from 'react-native';
import { MyText } from './MyText';
import colors from '../utils/colors';
import ArrowLeftExtended from '../icons/ArrowLeftExtended';

const SubHeader = ({ caption, onBack }) => (
  <Container>
    <Button onPress={onBack}>
      <ArrowLeftExtended color="#fff" size={20} />
    </Button>
    <Caption bold>{caption}</Caption>
    <Button as={View} />
  </Container>
);

const Button = styled.TouchableOpacity`
  width: 30px;
`;

const Container = styled.View`
  height: 50px;
  background-color: ${colors.app.color};
  flex-direction: row;
  align-items: center;
  padding-horizontal: 15px;
`;

const Caption = styled(MyText)`
  margin-horizontal: 15px;
  font-size: 20px;
  flex-grow: 1;
  text-align: center;
  color: #fff;
`;

export default SubHeader;
