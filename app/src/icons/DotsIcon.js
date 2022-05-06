import React from 'react';
import Svg, { G, Circle } from 'react-native-svg';

const DotsIcon = ({ size = 20, color }) => (
  <Svg height={size} width={size} viewBox="0 0 200 30">
    <G id="Dots" fill={color}>
      <Circle cx="30" cy="15" r="20" />
      <Circle cx="100" cy="15" r="20" />
      <Circle cx="170" cy="15" r="20" />
    </G>
  </Svg>
);

export default DotsIcon;
