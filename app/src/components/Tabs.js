import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';

import colors from '../utils/colors';

const tabHeight = 45;
const indicatorSpacing = 8;
const windowWidth = Dimensions.get('window').width;
const tabsHorizontalMargin = 0.1;
const tabsWidth = windowWidth * (1 - 2 * tabsHorizontalMargin);
const tabMarginHorizontal = tabsWidth * 0.02;

const Tabs = ({ state, descriptors, navigation, parentScroll, numberOfTabs, forceTop = false, backgroundColor = colors.app.colorDark }) => {
  const indicatorPosition = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.timing(indicatorPosition, {
      toValue: state.index,
      duration: 250,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);
  const tabWidth = tabsWidth * ((1 / numberOfTabs) * 0.9);
  return (
    <Animated.View style={styles.container(parentScroll, forceTop, backgroundColor)}>
      <Animated.View style={[styles.indicatorStyle(tabWidth), styles.indicatorPosition(indicatorPosition, tabWidth, numberOfTabs)]} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={label}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabStyle}>
            <Text style={[styles.labelStyle, isFocused && styles.activeLabelStyle]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: (parentScroll, forceTop, backgroundColor) => ({
    height: tabHeight,
    borderRadius: tabHeight,
    overflow: 'hidden',
    zIndex: 1000,
    backgroundColor,
    marginHorizontal: windowWidth * tabsHorizontalMargin,
    marginBottom: 10,
    flexGrow: 0,
    flexDirection: 'row',
    transform: [
      {
        translateY:
          parentScroll?.interpolate && !forceTop ? parentScroll.interpolate({ inputRange: [0, 100], outputRange: [90, 0], extrapolate: 'clamp' }) : 0,
      },
    ],
  }),
  indicatorStyle: (tabWidth) => ({
    backgroundColor: '#fff',
    height: tabHeight - indicatorSpacing,
    borderRadius: tabHeight - indicatorSpacing,
    marginTop: indicatorSpacing / 2,
    marginHorizontal: tabMarginHorizontal,
    width: tabWidth,
    position: 'absolute',
  }),
  indicatorPosition: (position, tabWidth, numberOfTabs) => ({
    transform: [
      {
        translateX: position.interpolate({
          inputRange: [0, 1],
          outputRange: [0, tabWidth + (numberOfTabs === 3 ? 1.5 : 3) * tabMarginHorizontal],
        }),
      },
    ],
  }),
  tabStyle: {
    backgroundColor: 'transparent',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelStyle: {
    textTransform: 'none',
    fontFamily: 'NexaRegular',
    fontSize: 15,
    color: '#fff',
  },
  activeLabelStyle: {
    color: colors.app.secondary,
  },
});

export default Tabs;
