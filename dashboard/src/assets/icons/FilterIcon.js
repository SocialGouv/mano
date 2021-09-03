import React from 'react';
import styled from 'styled-components';
import Svg, { Path } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const FilterIcon = ({ color, size = 30, style = {} }) => (
  <SvgStyled x="0px" y="0px" width={size} height={size} viewBox="0 0 18 12" style={style}>
    <Path d="M7 12H11V10H7V12ZM0 0V2H18V0H0ZM3 7H15V5H3V7Z" fill={color} />
  </SvgStyled>
);

export default FilterIcon;
