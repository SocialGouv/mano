import React, { useState } from 'react';
import styled from 'styled-components';
import { Animated, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import ButtonRight from './ButtonRight';
import Svg, { Circle } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ScreenTitle = ({ title, onBack, onAdd, backgroundColor = '#fff', color = '#000', offset, onLayout }) => {
  const showRightButton = Boolean(onAdd);
  const [titleHeight, setTitleHeight] = useState(0);
  // const [_offset, set_offset] = useState(0);
  // useEffect(() => {
  //   return () => {
  //     set_offset(getCurveOptions());
  //   };
  // }, [offset]);

  let animatedOffset, animatedRadius;

  if (offset) {
    if (!(offset instanceof Animated.Value)) {
      animatedOffset = -1000 + titleHeight + 25;
      animatedRadius = 1000;
    } else {
      animatedOffset = offset.interpolate({
        inputRange: [0, 100],
        outputRange: [-1000 + titleHeight + 25, -3000 + titleHeight],
        extrapolate: 'clamp',
      });
      animatedRadius = offset.interpolate({
        inputRange: [0, 100],
        outputRange: [1000, 3000],
        extrapolate: 'clamp',
      });
    }
  }

  return (
    <>
      <Container
        backgroundColor={backgroundColor}
        onLayout={(e) => {
          setTitleHeight(e.nativeEvent.layout.height);
          if (onLayout) {
            onLayout(e);
          }
        }}>
        <StatusBar backgroundColor={backgroundColor} />
        <TitleContainer backgroundColor={backgroundColor}>
          <ButtonContainer pointerEvents={onBack ? 'auto' : 'none'} show={Boolean(onBack)}>
            <TouchableOpacity onPress={onBack}>
              <Icon>
                <Back color={color}>{'<'}</Back>
              </Icon>
            </TouchableOpacity>
          </ButtonContainer>
          <Title ellipsizeMode="tail" color={color}>
            {title}
          </Title>
          <ButtonContainer pointerEvents={showRightButton ? 'auto' : 'none'} show={showRightButton}>
            {Boolean(onAdd) && <ButtonRight onPress={onAdd} caption="+" color={color} />}
          </ButtonContainer>
        </TitleContainer>
      </Container>
      {offset && (
        <CurveContainer pointerEvents={'none'}>
          <AnimatedCircle
            cx={`${Dimensions.get('window').width / 2}`}
            // cy={`-${1000 - titleHeight - 25 + }`}
            cy={animatedOffset}
            r={animatedRadius}
            fill={backgroundColor}
            opacity="1"
            accessible={false}
          />
        </CurveContainer>
      )}
    </>
  );
};

const Container = styled.SafeAreaView`
  background-color: ${(props) => props.backgroundColor};
  overflow: visible;
  z-index: 100;
`;

const TitleContainer = styled.View`
  padding-horizontal: 15px;
  padding-top: 5px;
  padding-bottom: 10px;
  align-items: center;
  flex-direction: row;
  background-color: ${(props) => props.backgroundColor};
`;

const Title = styled.Text`
  font-size: 20px;
  flex-grow: 1;
  flex-shrink: 1;
  text-align: center;
  color: ${(props) => props.color};
`;

const ButtonContainer = styled.View`
  ${(props) => !props.show && 'opacity: 0;'}
  min-width: 30px;
`;

const iconSize = 30;
const Icon = styled.View`
  height: ${iconSize}px;
  width: ${iconSize}px;
  margin-right: 15px;
`;

const Back = styled.Text`
  align-self: center;
  font-size: ${iconSize - 4}px;
  line-height: ${iconSize - 1}px;
  color: ${(props) => props.color};
  text-align: center;
`;

const CurveContainer = styled(AnimatedSvg)`
  position: absolute;
  z-index: 99;
`;

export default ScreenTitle;
