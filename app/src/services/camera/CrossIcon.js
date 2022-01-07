import React from 'react';
import styled from 'styled-components';
import Svg, { G, Line } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const CrossIcon = ({ color = '#ffffff', size = 20 }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 213 210">
    <G stroke="none" strokeWidth="1" fill={color} fillRule="evenodd" strokeLinecap="round">
      <G id="Cross" transform="translate(5.000000, 5.000000)" stroke={color} strokeWidth="30">
        <Line x1="0.5" y1="0.5" x2="202.5" y2="198.5" id="Line" />
        <Line x1="202.5" y1="0.5" x2="0.5" y2="199.5" id="Line-2" />
      </G>
    </G>
  </SvgStyled>
);

export default CrossIcon;
