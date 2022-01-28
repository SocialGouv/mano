import React, { useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ActionsList from './ActionsList';
import Tabs from '../../components/Tabs';
import { CANCEL, DONE, TODO } from '../../recoil/actions';

const TabNavigator = createMaterialTopTabNavigator();

const ActionsTabNavigator = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: scrollY,
          },
        },
      },
    ],
    { useNativeDriver: true }
  );
  return (
    <SceneContainer>
      <ScreenTitle title="Agenda" parentScroll={scrollY} />
      <TabNavigator.Navigator
        tabBar={(props) => <Tabs numberOfTabs={3} parentScroll={scrollY} {...props} />}
        lazy
        removeClippedSubviews={Platform.OS === 'android'}
        swipeEnabled>
        <TabNavigator.Screen name={TODO} options={{ tabBarLabel: 'À Faire' }}>
          {(props) => <ActionsList onScroll={onScroll} parentScroll={scrollY} status={TODO} />}
        </TabNavigator.Screen>
        <TabNavigator.Screen name={DONE} options={{ tabBarLabel: 'Faites' }}>
          {(props) => <ActionsList onScroll={onScroll} parentScroll={scrollY} status={DONE} />}
        </TabNavigator.Screen>
        <TabNavigator.Screen name={CANCEL} options={{ tabBarLabel: 'Annulées' }}>
          {(props) => <ActionsList onScroll={onScroll} parentScroll={scrollY} status={CANCEL} />}
        </TabNavigator.Screen>
      </TabNavigator.Navigator>
    </SceneContainer>
  );
};

export default ActionsTabNavigator;
