/* eslint-disable max-len */
import React from 'react';
import styled from 'styled-components';
import Svg, { Path, Line } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const EyeIcon = ({ color = '#000000', size = 25, strikedThrough }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 16 11">
    <Path
      d="M6.46808 3.91489C6.89929 3.48369 7.40993 3.26809 8 3.26809C8.59007 3.26809 9.10071 3.48369 9.53191 3.91489C9.96312 4.3461 10.1787 4.85673 10.1787 5.44681C10.1787 6.03688 9.96312 6.54752 9.53191 6.97872C9.10071 7.40993 8.59007 7.62553 8 7.62553C7.40993 7.62553 6.89929 7.40993 6.46808 6.97872C6.03688 6.54752 5.82128 6.03688 5.82128 5.44681C5.82128 4.85673 6.03688 4.3461 6.46808 3.91489ZM5.41277 8.03404C6.13901 8.73759 7.00141 9.08936 8 9.08936C8.99859 9.08936 9.85532 8.73192 10.5702 8.01702C11.2851 7.30212 11.6426 6.44539 11.6426 5.44681C11.6426 4.44822 11.2851 3.59149 10.5702 2.8766C9.85532 2.1617 8.99859 1.80426 8 1.80426C7.00141 1.80426 6.14468 2.1617 5.42979 2.8766C4.71489 3.59149 4.35745 4.44822 4.35745 5.44681C4.35745 6.44539 4.70922 7.3078 5.41277 8.03404ZM3.13191 1.49787C4.5844 0.499286 6.20708 0 8 0C9.79292 0 11.4156 0.499286 12.8681 1.49787C14.3206 2.49646 15.3645 3.81276 16 5.44681C15.3645 7.08086 14.3206 8.39716 12.8681 9.39574C11.4156 10.3943 9.79292 10.8936 8 10.8936C6.20708 10.8936 4.5844 10.3943 3.13191 9.39574C1.67943 8.39716 0.635464 7.08086 0 5.44681C0.635464 3.81276 1.67943 2.49646 3.13191 1.49787Z"
      fill="#bfbfbf"
    />
    {!!strikedThrough && (
      <Line
        x1="0.5"
        y1="10.5"
        x2="16.5"
        y2="0.5"
        id="Line-2"
        stroke="#bfbfbf"
        strokeLinecap="square"
      />
    )}
  </SvgStyled>
);

export default EyeIcon;
