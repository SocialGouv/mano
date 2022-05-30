import React from 'react';
import { Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ActionsList from './ActionsList';
import Tabs from '../../components/Tabs';
import { CANCEL, DONE, TODO } from '../../recoil/actions';

const TabNavigator = createMaterialTopTabNavigator();

const ActionsTabNavigator = () => {
  return (
    <SceneContainer>
      <TabNavigator.Navigator
        tabBar={(props) => (
          <>
            <ScreenTitle title="Agenda" forceTop />
            <Tabs numberOfTabs={3} forceTop {...props} />
          </>
        )}
        lazy
        removeClippedSubviews={Platform.OS === 'android'}
        swipeEnabled>
        <TabNavigator.Screen name={TODO} options={{ tabBarLabel: 'À Faire' }} component={ActionsList} initialParams={{ status: TODO }} />
        <TabNavigator.Screen name={DONE} options={{ tabBarLabel: 'Faites' }} component={ActionsList} initialParams={{ status: DONE }} />
        <TabNavigator.Screen name={CANCEL} options={{ tabBarLabel: 'Annulées' }} component={ActionsList} initialParams={{ status: CANCEL }} />
      </TabNavigator.Navigator>
    </SceneContainer>
  );
};

export default ActionsTabNavigator;
