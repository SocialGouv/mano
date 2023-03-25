/* eslint-disable max-len */
import React from 'react';
import styled from 'styled-components';
import Svg, { G, Path } from 'react-native-svg';

const SvgStyled = styled(Svg)``;

const Structures = ({ color, size = 30 }) => (
  <SvgStyled width={size} height={size} viewBox="0 0 197 200">
    <G id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <Path
        d="M98.1288981,0 C71.8918919,0 47.2349272,10.3950104 28.6902287,29.3139293 C10.1871102,48.1912682 0,73.3056133 0,100 C0,126.694387 10.1871102,151.808732 28.6902287,170.686071 C47.2349272,189.60499 71.8918919,200 98.1288981,200 C124.365904,200 149.022869,189.60499 167.567568,170.686071 C186.070686,151.808732 196.257796,126.694387 196.257796,100 C196.257796,73.3056133 186.070686,48.1912682 167.567568,29.3139293 C149.022869,10.4365904 124.365904,0 98.1288981,0 Z M148.607069,95.010395 C148.232848,78.5031185 145.904366,63.1600832 142.079002,49.8544699 C148.856549,46.4033264 155.218295,42.1205821 161.122661,37.0893971 C175.634096,52.2245322 184.948025,72.5155925 186.153846,95.010395 L148.607069,95.010395 Z M125.821206,165.031185 C118.212058,180.914761 108.108108,190.02079 98.1288981,190.02079 C88.1496881,190.02079 78.045738,180.914761 70.4365904,165.031185 C69.022869,162.037422 67.6923077,158.877339 66.4864865,155.592516 C76.4656965,151.683992 87.1933472,149.60499 98.1288981,149.60499 C109.064449,149.60499 119.7921,151.683992 129.77131,155.592516 C128.565489,158.877339 127.276507,162.037422 125.821206,165.031185 Z M138.918919,159.7921 C144.158004,162.577963 149.147609,165.945946 153.762994,169.77131 C145.155925,176.964657 135.176715,182.494802 124.324324,185.945946 C130.02079,179.251559 134.968815,170.31185 138.918919,159.7921 Z M71.9334719,185.945946 C61.0810811,182.494802 51.1018711,176.923077 42.4948025,169.77131 C47.1517672,165.904366 52.0997921,162.577963 57.3388773,159.7921 C61.2889813,170.31185 66.2370062,179.251559 71.9334719,185.945946 Z M98.1288981,139.5842 C86.1122661,139.5842 74.3866944,141.787942 63.4511435,146.029106 C60,133.638254 58.004158,119.62578 57.6715177,104.989605 L138.669439,104.989605 C138.295218,119.62578 136.299376,133.638254 132.889813,146.029106 C121.829522,141.829522 110.10395,139.5842 98.1288981,139.5842 Z M57.6299376,95.010395 C58.004158,80.3326403 60,66.3617464 63.4095634,53.970894 C74.3866944,58.2120582 86.1122661,60.4158004 98.0873181,60.4158004 C110.10395,60.4158004 121.829522,58.2120582 132.765073,53.970894 C136.216216,66.3617464 138.212058,80.3742204 138.544699,95.010395 L57.6299376,95.010395 Z M70.4365904,34.968815 C78.045738,19.0852391 88.1496881,9.97920998 98.1288981,9.97920998 C108.108108,9.97920998 118.212058,19.0852391 125.821206,34.968815 C127.234927,37.962578 128.565489,41.1226611 129.77131,44.4074844 C119.7921,48.3160083 109.064449,50.3950104 98.1288981,50.3950104 C87.1933472,50.3950104 76.4656965,48.3160083 66.4864865,44.4074844 C67.6923077,41.1226611 68.981289,37.962578 70.4365904,34.968815 Z M57.3388773,40.2079002 C52.0997921,37.4220374 47.1101871,34.0540541 42.4948025,30.2286902 C51.1018711,23.035343 61.0810811,17.5051975 71.9334719,14.0540541 C66.2370062,20.7484407 61.2889813,29.6881497 57.3388773,40.2079002 Z M124.324324,14.0540541 C135.176715,17.5051975 145.155925,23.0769231 153.762994,30.2286902 C149.106029,34.0956341 144.158004,37.4220374 138.918919,40.2079002 C134.968815,29.6881497 130.02079,20.7484407 124.324324,14.0540541 Z M35.1351351,37.0893971 C41.039501,42.1205821 47.4012474,46.4033264 54.1787942,49.8544699 C50.3534304,63.2016632 48.024948,78.5031185 47.6507277,95.010395 L10.1039501,95.010395 C11.3097713,72.5155925 20.6652807,52.2245322 35.1351351,37.0893971 Z M10.1039501,104.989605 L47.6507277,104.989605 C48.024948,121.496881 50.3534304,136.839917 54.1787942,150.14553 C47.4012474,153.596674 41.039501,157.879418 35.1351351,162.910603 C20.6652807,147.775468 11.3097713,127.484407 10.1039501,104.989605 Z M161.122661,162.910603 C155.218295,157.879418 148.856549,153.596674 142.079002,150.14553 C145.904366,136.798337 148.232848,121.496881 148.607069,104.989605 L186.153846,104.989605 C184.948025,127.484407 175.592516,147.775468 161.122661,162.910603 Z"
        id="Structures"
        fill={color}
        fillRule="nonzero"
      />
    </G>
  </SvgStyled>
);

export default Structures;