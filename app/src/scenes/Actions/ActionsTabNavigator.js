import React from 'react';
import { Animated, Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ActionsList from './ActionsList';
import Tabs from '../../components/Tabs';
import { CANCEL, DONE, TODO } from '../../contexts/actions';

const TabNavigator = createMaterialTopTabNavigator();

class ActionsTabNavigator extends React.Component {
  state = {
    scrollY: new Animated.Value(0),
  };
  onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: this.state.scrollY,
          },
        },
      },
    ],
    { useNativeDriver: true }
  );

  handleCurrentScroll = (scroll = 0) => {
    Animated.timing(this.state.scrollY, {
      toValue: Math.min(scroll, 100),
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  render() {
    return (
      <SceneContainer>
        <ScreenTitle title="Agenda" parentScroll={this.state.scrollY} />
        <TabNavigator.Navigator
          tabBar={(props) => <Tabs numberOfTabs={3} parentScroll={this.state.scrollY} {...props} />}
          lazy
          removeClippedSubviews={Platform.OS === 'android'}
          swipeEnabled>
          <TabNavigator.Screen name={TODO} options={{ tabBarLabel: 'À Faire' }}>
            {(props) => (
              <ActionsList
                {...this.state}
                {...this.props}
                selfProps={props}
                onScroll={this.onScroll}
                handleCurrentScroll={this.handleCurrentScroll}
                parentScroll={this.state.scrollY}
                status={TODO}
              />
            )}
          </TabNavigator.Screen>
          <TabNavigator.Screen name={DONE} options={{ tabBarLabel: 'Faites' }}>
            {(props) => (
              <ActionsList
                {...this.state}
                {...this.props}
                selfProps={props}
                onScroll={this.onScroll}
                handleCurrentScroll={this.handleCurrentScroll}
                parentScroll={this.state.scrollY}
                status={DONE}
              />
            )}
          </TabNavigator.Screen>
          <TabNavigator.Screen name={CANCEL} options={{ tabBarLabel: 'Annulées' }}>
            {(props) => (
              <ActionsList
                {...this.state}
                {...this.props}
                selfProps={props}
                onScroll={this.onScroll}
                handleCurrentScroll={this.handleCurrentScroll}
                parentScroll={this.state.scrollY}
                status={CANCEL}
              />
            )}
          </TabNavigator.Screen>
        </TabNavigator.Navigator>
      </SceneContainer>
    );
  }
}

export default ActionsTabNavigator;
