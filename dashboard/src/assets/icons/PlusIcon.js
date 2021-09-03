/* eslint-disable max-len */
import React from 'react';
import styled from 'styled-components';
import Svg, { G, Path } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const PlusIcon = ({ color, size = 30 }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 512 512">
    <G id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <Path
        d="M492,236H276V20c0-11.046-8.954-20-20-20c-11.046,0-20,8.954-20,20v216H20c-11.046,0-20,8.954-20,20s8.954,20,20,20h216
			v216c0,11.046,8.954,20,20,20s20-8.954,20-20V276h216c11.046,0,20-8.954,20-20C512,244.954,503.046,236,492,236z"
        id="Plus"
        fill={color}
        stroke={color}
        fillRule="nonzero"
      />
    </G>
  </SvgStyled>
);

export default PlusIcon;
