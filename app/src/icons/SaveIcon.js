/* eslint-disable max-len */
import React from 'react';
import styled from 'styled-components';
import Svg, { G, Path } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const SaveIcon = ({ color = '#000000', size = 25, disabled }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 200 200">
    <G stroke="none" strokeWidth="1" fill={disabled ? `${color}33` : color} fillRule="evenodd">
      <Path d="M191.85,1.62 L30.98,1.62 C29.21,1.62 27.5,2.35 26.28,3.61 L3.46,27.25 C2.27,28.47 1.62,30.08 1.62,31.79 L1.62,191.85 C1.62,195.45 4.55,198.38 8.15,198.38 L191.84,198.38 C195.44,198.38 198.370026,195.45 198.370026,191.85 L198.370026,8.15 C198.38,4.55 195.45,1.62 191.85,1.62 Z M71.09,41.18 L71.09,14.69 L140.74,14.69 L140.74,41.18 L71.09,41.18 Z M64.55,54.25 L147.26,54.25 C150.86,54.25 153.79,51.32 153.79,47.72 L153.79,14.69 L185.3,14.69 L185.3,185.32 L14.69,185.32 L14.69,34.43 L33.76,14.69 L58.03,14.69 L58.03,47.72 C58.02,51.31 60.95,54.25 64.55,54.25 Z" />
      <Path d="M105.91,158.18 C127.5,158.18 145.07,140.61 145.07,119.02 C145.07,97.42 127.5,79.86 105.91,79.86 C84.32,79.86 66.75,97.43 66.75,119.02 C66.75,140.61 84.32,158.18 105.91,158.18 Z M79.81,119.02 C79.81,104.63 91.52,92.92 105.91,92.92 C120.3,92.92 132.01,104.63 132.01,119.02 C132.01,133.41 120.3,145.12 105.91,145.12 C91.52,145.12 79.81,133.41 79.81,119.02 Z" />
    </G>
  </SvgStyled>
);

export default SaveIcon;