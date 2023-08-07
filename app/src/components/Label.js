import React from 'react';
import styled from 'styled-components';

const Label = ({ label }) => <LabelStyled>{label}</LabelStyled>;

const LabelStyled = styled.Text`
  margin-bottom: 10px;
  font-weight: bold;
`;

export default Label;
