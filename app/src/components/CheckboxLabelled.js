import React from 'react';
import styled, { css } from 'styled-components';
import colors from '../utils/colors';
import { MyText } from './MyText';

const CheckboxLabelled = ({ _id, label, onPress, value, bold, alone = false }) => (
  <Touchable onPress={() => onPress({ _id, value: !value, label })}>
    <Container alone={alone}>
      <CheckBoxContainer bold={bold}>
        <CheckBox isSelected={Boolean(value)} />
      </CheckBoxContainer>
      {label && <LabelStyled bold={bold}>{label}</LabelStyled>}
    </Container>
  </Touchable>
);

const Touchable = styled.TouchableWithoutFeedback``;

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${(props) => (props.alone ? 25 : 0)}px;
  padding-vertical: ${(props) => (props.alone ? 0 : 10)}px;
  padding-horizontal: ${(props) => (props.alone ? 0 : 12)}px;
`;

const selectedCss = css`
  background-color: ${colors.app.color};
`;
const CheckBox = styled.View`
  border-radius: 3px;
  flex-grow: 1;
  ${(props) => props.isSelected && selectedCss}
`;
const CheckBoxContainer = styled.View`
  margin-right: 10px;
  height: 20px;
  width: 20px;
  border-radius: 3px;
  border: ${(props) => (props.bold ? 2 : 1)}px solid ${colors.app.color};
  padding: 2px;
`;

const LabelStyled = styled(MyText)`
  ${(props) => props.bold && 'font-weight: bold;'}
  ${(props) => props.bold && 'font-size: 18px;'}
  ${(props) => props.bold && 'margin-left: 15px;'}
  line-height: 22px;
  text-align-vertical: center;
`;

export default CheckboxLabelled;
