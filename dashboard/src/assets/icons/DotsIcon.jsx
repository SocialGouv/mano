import React from "react";

const DotsIcon = ({ size = 20 }) => (
  <svg height={size} width={size} viewBox="0 0 200 30">
    <g id="Dots" fill="currentColor">
      <circle cx="30" cy="15" r="20" />
      <circle cx="100" cy="15" r="20" />
      <circle cx="170" cy="15" r="20" />
    </g>
  </svg>
);

export default DotsIcon;
