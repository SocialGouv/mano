import React from 'react';
import styled from 'styled-components/native';
import { View } from 'react-native';
import { MyText } from './MyText';
import colors from '../utils/colors';
import ArrowLeftExtended from '../icons/ArrowLeftExtended';

const SubHeader = ({ caption, onBack, backgroundColor }) => (
  <Container backgroundColor={backgroundColor || colors.app.color}>
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
  background-color: ${(props) => props.backgroundColor};
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
