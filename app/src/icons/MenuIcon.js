/* eslint-disable max-len */
import React from 'react';
import styled from 'styled-components';
import Svg, { G, Path } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const MenuIcon = ({ color, size = 30 }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 295 200">
    <G id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <Path
        d="M5.26315512,-1.42108547e-14 C2.35641981,-1.42108547e-14 0,3.35775 0,7.5 C0,11.6415 2.35641981,15 5.26315512,15 L289.473532,15 C292.380267,15 294.736687,11.6415 294.736687,7.5 C294.736687,3.35775 292.380267,-1.42108547e-14 289.473532,-1.42108547e-14 L5.26315512,-1.42108547e-14 Z M5.26315512,93 C2.35641981,93 0,96.35775 0,100.5 C0,104.6415 2.35641981,108 5.26315512,108 L289.473532,108 C292.380267,108 294.736687,104.6415 294.736687,100.5 C294.736687,96.35775 292.380267,93 289.473532,93 L5.26315512,93 Z M5.26315512,185.47369 C2.35641981,185.47369 0,188.83144 0,192.97369 C0,197.11519 2.35641981,200.47369 5.26315512,200.47369 L289.473532,200.47369 C292.380267,200.47369 294.736687,197.11519 294.736687,192.97369 C294.736687,188.83144 292.380267,185.47369 289.473532,185.47369 L5.26315512,185.47369 Z"
        id="Calendar"
        fill={color}
        fillRule="nonzero"
      />
    </G>
  </SvgStyled>
);

export default MenuIcon;