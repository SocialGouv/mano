import React, { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AgendaIcon, PersonIcon, TerritoryIcon } from './icons';
import { AppState } from 'react-native';
import { RecoilRoot } from 'recoil';
import logEvents from './services/logEvents';
import Login from './scenes/Login/Login';
import Action from './scenes/Actions/Action';
import NewActionForm from './scenes/Actions/NewActionForm';
import PersonsList from './scenes/Persons/PersonsList';
import PersonsSearch from './scenes/Persons/PersonsSearch';
import NewPersonForm from './scenes/Persons/NewPersonForm';
import Person from './scenes/Persons/Person';
import PersonsOutOfActiveListReason from './scenes/Persons/PersonsOutOfActiveListReason';
import AddRencontre from './scenes/Persons/AddRencontre';
import PersonsFilter from './scenes/Persons/PersonsFilter';
import StructuresList from './scenes/Structures/StructuresList';
import NewStructureForm from './scenes/Structures/NewStructureForm';
import Structure from './scenes/Structures/Structure';
import Comment from './scenes/Comments/Comment';
import Place from './scenes/Places/Place';
import NewPlaceForm from './scenes/Places/NewPlaceForm';
import Menu from './scenes/Menu/Menu';
import Legal from './scenes/Menu/Legal';
import Privacy from './scenes/Menu/Privacy';
import colors from './utils/colors';
import { TeamSelection, ChangeTeam } from './scenes/Login/TeamSelection';
import ActionsTabNavigator from './scenes/Actions/ActionsTabNavigator';
import ChangePassword from './scenes/Login/ChangePassword';
import ForgetPassword from './scenes/Login/ForgetPassword';
import ForceChangePassword from './scenes/Login/ForceChangePassword';
import TerritoriesList from './scenes/Territories/TerritoriesList';
import NewTerritoryForm from './scenes/Territories/NewTerritoryForm';
import Territory from './scenes/Territories/Territory';
import TerritoryObservation from './scenes/Territories/TerritoryObservation';
import EnvironmentIndicator from './components/EnvironmentIndicator';
import API from './services/api';
import Charte from './scenes/Menu/Charte';
import CharteAcceptance from './scenes/Login/CharteAcceptance';
import Loader from './components/Loader';
import BellWithNotifications from './scenes/Notifications/BellWithNotifications';
import DotsIcon from './icons/DotsIcon';
import Notifications from './scenes/Notifications/Notifications';
import ReportsCalendar from './scenes/Reports/ReportsCalendar';
import Report from './scenes/Reports/Report';
import Actions from './scenes/Reports/Actions';
import Comments from './scenes/Reports/Comments';
import Observations from './scenes/Reports/Observations';
import Collaborations from './scenes/Reports/Collaborations';
import Treatment from './scenes/Persons/Treatment';
import Consultation from './scenes/Persons/Consultation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

const ActionsStack = createStackNavigator();
const ActionsNavigator = () => {
  return (
    <ActionsStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ActionsList">
      <ActionsStack.Screen name="ActionsList" component={ActionsTabNavigator} />
      <ActionsStack.Screen name="Action" component={Action} />
      <ActionsStack.Screen name="NewActionForm" component={NewActionForm} />
      <ActionsStack.Screen name="PersonsSearch" component={PersonsSearch} />
      <ActionsStack.Screen name="NewPersonForm" component={NewPersonForm} />
      <ActionsStack.Screen name="ActionComment" component={Comment} />

      <ActionsStack.Screen name="Person" component={Person} />
      <ActionsStack.Screen name="PersonsOutOfActiveListReason" component={PersonsOutOfActiveListReason} />
      <ActionsStack.Screen name="AddRencontre" component={AddRencontre} />
      <ActionsStack.Screen name="PersonPlace" component={Place} />
      <ActionsStack.Screen name="NewPersonPlaceForm" component={NewPlaceForm} />
      <ActionsStack.Screen name="PersonComment" component={Comment} />

      <ActionsStack.Screen name="Consultation" component={Consultation} />
    </ActionsStack.Navigator>
  );
};

const PersonsStack = createStackNavigator();
const PersonsNavigator = () => {
  return (
    <PersonsStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PersonsList">
      <PersonsStack.Screen name="PersonsList" component={PersonsList} />
      <PersonsStack.Screen name="Person" component={Person} />
      <PersonsStack.Screen name="NewPersonForm" component={NewPersonForm} />
      <PersonsStack.Screen name="PersonsFilter" component={PersonsFilter} />
      <PersonsStack.Screen name="PersonsOutOfActiveListReason" component={PersonsOutOfActiveListReason} />
      <PersonsStack.Screen name="AddRencontre" component={AddRencontre} />
      <PersonsStack.Screen name="PersonPlace" component={Place} />
      <PersonsStack.Screen name="NewPersonPlaceForm" component={NewPlaceForm} />
      <PersonsStack.Screen name="PersonComment" component={Comment} />

      <PersonsStack.Screen name="Treatment" component={Treatment} />
      <PersonsStack.Screen name="Consultation" component={Consultation} />

      <PersonsStack.Screen name="Action" component={Action} />
      <PersonsStack.Screen name="NewActionForm" component={NewActionForm} />
      <PersonsStack.Screen name="PersonsSearch" component={PersonsSearch} />
      <PersonsStack.Screen name="ActionComment" component={Comment} />
    </PersonsStack.Navigator>
  );
};

const StructuresStack = createStackNavigator();
const StructuresNavigator = () => {
  return (
    <StructuresStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="StructuresList">
      <StructuresStack.Screen name="StructuresList" component={StructuresList} />
      <StructuresStack.Screen name="NewStructureForm" component={NewStructureForm} />
      <StructuresStack.Screen name="Structure" component={Structure} />
    </StructuresStack.Navigator>
  );
};

const TerritoriesStack = createStackNavigator();
const TerritoriesNavigator = () => {
  return (
    <TerritoriesStack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }} initialRouteName="TerritoriesList">
      <TerritoriesStack.Screen name="TerritoriesList" component={TerritoriesList} />
      <TerritoriesStack.Screen name="NewTerritoryForm" component={NewTerritoryForm} />
      <TerritoriesStack.Screen name="Territory" component={Territory} />
      <TerritoriesStack.Screen name="TerritoryObservation" component={TerritoryObservation} />
    </TerritoriesStack.Navigator>
  );
};

const NotificationsStack = createStackNavigator();
const NotificationsNavigator = () => {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Notifications">
      <NotificationsStack.Screen name="NotificationsList" component={Notifications} />
      <NotificationsStack.Screen name="ActionComment" component={Comment} />
      <NotificationsStack.Screen name="PersonComment" component={Comment} />
    </NotificationsStack.Navigator>
  );
};

const ReportsStack = createStackNavigator();
const ReportsNavigator = () => {
  return (
    <ReportsStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ReportsCalendar">
      <ReportsStack.Screen name="ReportsCalendar" component={ReportsCalendar} />
      <ReportsStack.Screen name="Report" component={Report} />
      <ReportsStack.Screen name="Collaborations" component={Collaborations} />

      <ReportsStack.Screen name="Action" component={Action} />
      <ReportsStack.Screen name="NewActionForm" component={NewActionForm} />
      <ReportsStack.Screen name="PersonsSearch" component={PersonsSearch} />
      <ActionsStack.Screen name="NewPersonForm" component={NewPersonForm} />
      <ReportsStack.Screen name="ActionComment" component={Comment} />

      <ReportsStack.Screen name="Person" component={Person} />
      <ReportsStack.Screen name="PersonsOutOfActiveListReason" component={PersonsOutOfActiveListReason} />
      <ReportsStack.Screen name="AddRencontre" component={AddRencontre} />
      <ReportsStack.Screen name="PersonPlace" component={Place} />
      <ReportsStack.Screen name="NewPersonPlaceForm" component={NewPlaceForm} />
      <ReportsStack.Screen name="PersonComment" component={Comment} />

      <ReportsStack.Screen name="Territory" component={Territory} />
      <ReportsStack.Screen name="TerritoryObservation" component={TerritoryObservation} />

      <ReportsStack.Screen name="Comments" component={Comments} />
      <ReportsStack.Screen name="Actions" component={Actions} />
      <ReportsStack.Screen name="Observations" component={Observations} />
    </ReportsStack.Navigator>
  );
};

const MenuStack = createStackNavigator();
const MenuNavigator = () => {
  return (
    <MenuStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Menu">
      <MenuStack.Screen name="Menu" component={Menu} />
      <MenuStack.Screen name="Reports" component={ReportsNavigator} />
      <MenuStack.Screen name="Structures" component={StructuresNavigator} />
      <MenuStack.Screen name="ChangePassword" component={ChangePassword} />
      <MenuStack.Screen name="ChangeTeam" component={ChangeTeam} />
      <MenuStack.Screen name="Legal" component={Legal} />
      <MenuStack.Screen name="Privacy" component={Privacy} />
      <MenuStack.Screen name="Charte" component={Charte} />
    </MenuStack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Agenda"
    screenOptions={{
      gestureEnabled: false,
      headerShown: false,
      tabBarActiveTintColor: colors.app.color,
      tabBarnactiveTintColor: '#aaa',
    }}>
    <Tab.Screen
      lazy
      name="Agenda"
      component={ActionsNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <AgendaIcon size={size} color={color} />,
        tabBarLabel: 'AGENDA',
        tabBarTestID: 'tab-bar-actions',
      }}
    />
    <Tab.Screen
      lazy
      name="Territories"
      component={TerritoriesNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <TerritoryIcon size={size} color={color} />,
        tabBarLabel: 'TERRITOIRES',
        tabBarTestID: 'tab-bar-territories',
      }}
    />
    <Tab.Screen
      lazy
      name="Persons"
      component={PersonsNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <PersonIcon size={size} color={color} />,
        tabBarLabel: 'USAGERS',
        tabBarTestID: 'tab-bar-persons',
      }}
    />
    <Tab.Screen
      lazy
      name="Notifications"
      component={NotificationsNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <BellWithNotifications size={size} color={color} />,
        tabBarLabel: 'PRIORITÉS',
        tabBarTestID: 'tab-bar-notifications',
      }}
    />
    <Tab.Screen
      lazy
      name="MenuTab"
      component={MenuNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <DotsIcon size={size} color={color} />,
        tabBarLabel: 'MENU',
        tabBarTestID: 'tab-bar-profil',
      }}
    />
  </Tab.Navigator>
);

const LoginStack = createStackNavigator();
const LoginNavigator = () => (
  <LoginStack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <LoginStack.Screen name="Login" component={Login} />
    <LoginStack.Screen name="TeamSelection" component={TeamSelection} />
    <LoginStack.Screen name="CharteAcceptance" component={CharteAcceptance} />
    <LoginStack.Screen name="ForceChangePassword" component={ForceChangePassword} />
    <LoginStack.Screen name="ForgetPassword" component={ForgetPassword} />
  </LoginStack.Navigator>
);

const AppStack = createStackNavigator();

const App = () => {
  const appState = useRef(AppState.currentState);
  const appStateListener = useRef(null);
  const navigationRef = useNavigationContainerRef();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [resetLoginStackKey, setResetLoginStackKey] = useState(0);

  useEffect(() => {
    logEvents.initLogEvents().then(() => {
      logEvents.logAppVisit();
      appStateListener.current = AppState.addEventListener('change', (nextAppState) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          if (API.token) API.get({ path: '/check-auth' }); // will force logout if session is expired
          logEvents.logAppVisit();
        } else {
          logEvents.logAppClose();
        }
        appState.current = nextAppState;
      });
    });

    API.onLogIn = () => setIsLoggedIn(true);
    API.logout = () => {
      setResetLoginStackKey((k) => k + 1);
      API.token = null;
      AsyncStorage.removeItem('persistent_token');
      API.enableEncrypt = null;
      API.wrongKeyWarned = null;
      API.hashedOrgEncryptionKey = null;
      API.orgEncryptionKey = null;
      API.sendCaptureError = null;
      API.blockEncrypt = null;
      API.organisation = null;
      setIsLoggedIn(false);
    };

    return () => {
      logEvents.logAppClose();
      appStateListener.current.remove();
    };
  }, []);

  return (
    <RecoilRoot>
      <ActionSheetProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            API.navigation = navigationRef;
          }}>
          <AppStack.Navigator initialRouteName="LoginStack" screenOptions={{ gestureEnabled: false, headerShown: false }}>
            <AppStack.Screen name="LoginStack" component={LoginNavigator} key={resetLoginStackKey} />
            {!!isLoggedIn && <AppStack.Screen name="Home" component={TabNavigator} />}
          </AppStack.Navigator>
          <Loader />
          <EnvironmentIndicator />
        </NavigationContainer>
      </ActionSheetProvider>
    </RecoilRoot>
  );
};

export default Sentry.wrap(App);
