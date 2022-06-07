import React from 'react';
import styled from 'styled-components';
import Svg, { Path } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const ArrowLeftExtended = ({ color, size = 30 }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 19 16">
    <Path
      d="M18.4219 6.70312H3.84375L9.11719 1.40625L7.71094 0L0 7.71094L7.71094 15.4219L9.11719 14.0156L3.84375 8.71875H18.4219V6.70312Z"
      fill={color}
      fillRule="nonzero"
    />
  </SvgStyled>
);

export default ArrowLeftExtended;
