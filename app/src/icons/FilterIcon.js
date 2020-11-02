import React from 'react';
import Svg, { Path } from 'react-native-svg';

const FilterIcon = ({ color, size = 30, style = {} }) => (
  <Svg x="0px" y="0px" width={size} height={size} viewBox="0 0 459 459" style={style}>
    <Path
      d="M178.5,382.5h102v-51h-102V382.5z M0,76.5v51h459v-51H0z M76.5,255h306v-51h-306V255z"
      fill={color}
    />
  </Svg>
);

export default FilterIcon;
