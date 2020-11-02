import React from 'react';
import { Animated, StyleSheet } from 'react-native';

function StickOnTitleContainer({
  children,
  titleHeight,
  backgroundColor,
  offsetAnimationValue,
  style = {},
}) {
  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          top: offsetAnimationValue.interpolate({
            inputRange: [0, 110],
            outputRange: [110, titleHeight],
            extrapolate: 'clamp',
          }),
        },
        {
          backgroundColor: offsetAnimationValue.interpolate({
            inputRange: [0, 80, 100],
            outputRange: ['transparent', 'transparent', backgroundColor],
            extrapolate: 'clamp',
          }),
        },
        {
          borderRadius: offsetAnimationValue.interpolate({
            inputRange: [0, 80, 100],
            outputRange: [100, 100, 0],
            extrapolate: 'clamp',
          }),
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    width: '100%',
    zIndex: 98,
  },
});

export default StickOnTitleContainer;
