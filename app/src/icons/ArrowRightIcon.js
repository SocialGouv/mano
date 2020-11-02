/* eslint-disable max-len */
import React from 'react';
import styled from 'styled-components';
import Svg, { G, Path } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const ArrowRightIcon = ({ color, size = 30 }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 116 200">
    <G id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <Path
        d="M25.7875152,4.34180451 C19.881463,-1.47592908 10.3891237,-1.44297217 4.52361111,4.41563167 C-1.34190146,10.2742355 -1.38604554,19.7665294 4.42472342,25.679434 L78.6786676,99.9585405 L4.42472342,174.212485 C0.608628026,178.02858 -0.881726948,183.59066 0.515060818,188.803543 C1.91184858,194.016426 5.98357379,198.088151 11.1964569,199.484939 C16.40934,200.881727 21.9714201,199.391372 25.7875152,195.575277 L110.710274,110.627355 C113.545215,107.795566 115.138134,103.952943 115.138134,99.9459594 C115.138134,95.9389753 113.545215,92.0963526 110.710274,89.2645635 L25.7875152,4.34180451 Z"
        id="ArrowRight"
        fill={color}
        fillRule="nonzero"
      />
    </G>
  </SvgStyled>
);

export default ArrowRightIcon;
