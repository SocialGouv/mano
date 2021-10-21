import React from 'react';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AgendaIcon, StructuresIcon, PersonIcon, MenuIcon, TerritoryIcon } from './icons';
import { AppState } from 'react-native';
import Login from './scenes/Login/Login';
import Action from './scenes/Actions/Action';
import NewActionForm from './scenes/Actions/NewActionForm';
import PersonsList from './scenes/Persons/PersonsList';
import PersonsSearch from './scenes/Persons/PersonsSearch';
import NewPersonForm from './scenes/Persons/NewPersonForm';
import Person from './scenes/Persons/Person';
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
import PersonsFilter from './scenes/Persons/PersonsFilter';
import RootContextsProvider from './contexts/rootProvider';
import { StructuresProvider } from './contexts/structures';
import { ActionsByStatusProvider, PersonsSelectorsProvider } from './contexts/selectors';
import EnvironmentIndicator from './components/EnvironmentIndicator';
import API from './services/api';
import Charte from './scenes/Menu/Charte';
import CharteAcceptance from './scenes/Login/CharteAcceptance';

const ActionsStack = createStackNavigator();
const ActionsNavigator = () => {
  return (
    <ActionsStack.Navigator headerMode="none" initialRouteName="ActionsList">
      <ActionsStack.Screen name="ActionsList" component={ActionsTabNavigator} />
      <ActionsStack.Screen name="Action" component={Action} />
      <ActionsStack.Screen name="NewActionForm" component={NewActionForm} />
      <ActionsStack.Screen name="ActionComment" component={Comment} />
    </ActionsStack.Navigator>
  );
};

const PersonsStack = createStackNavigator();
const PersonsNavigator = () => {
  return (
    <PersonsStack.Navigator headerMode="none" initialRouteName="PersonsList">
      <PersonsStack.Screen name="PersonsList" component={PersonsList} />
      <PersonsStack.Screen name="Person" component={Person} />
      <PersonsStack.Screen name="PersonsSearch" component={PersonsSearch} />
      <PersonsStack.Screen name="NewPersonForm" component={NewPersonForm} />
      <PersonsStack.Screen name="PersonPlace" component={Place} />
      <PersonsStack.Screen name="NewPersonPlaceForm" component={NewPlaceForm} />
      <PersonsStack.Screen name="PersonComment" component={Comment} />
      <PersonsStack.Screen name="PersonsFilter" component={PersonsFilter} />
    </PersonsStack.Navigator>
  );
};

const StructuresStack = createStackNavigator();
const StructuresNavigator = () => {
  return (
    <StructuresStack.Navigator headerMode="none" initialRouteName="StructuresList">
      <StructuresStack.Screen name="StructuresList" component={StructuresList} />
      <StructuresStack.Screen name="NewStructureForm" component={NewStructureForm} />
      <StructuresStack.Screen name="Structure" component={Structure} />
    </StructuresStack.Navigator>
  );
};

const TerritoriesStack = createStackNavigator();
const TerritoriesNavigator = () => {
  return (
    <TerritoriesStack.Navigator headerMode="none" initialRouteName="TerritoriesList" screenOptions={{ gestureEnabled: false }}>
      <TerritoriesStack.Screen name="TerritoriesList" component={TerritoriesList} />
      <TerritoriesStack.Screen name="NewTerritoryForm" component={NewTerritoryForm} />
      <TerritoriesStack.Screen name="Territory" component={Territory} />
      <TerritoriesStack.Screen name="TerritoryObservation" component={TerritoryObservation} />
    </TerritoriesStack.Navigator>
  );
};

const MenuStack = createStackNavigator();
const MenuNavigator = () => {
  return (
    <MenuStack.Navigator headerMode="none" initialRouteName="Menu">
      <MenuStack.Screen name="Menu" component={Menu} />
      <MenuStack.Screen name="ChangePassword" component={ChangePassword} />
      <MenuStack.Screen name="ChangeTeam" component={ChangeTeam} />
      <MenuStack.Screen name="Legal" component={Legal} />
      <MenuStack.Screen name="Privacy" component={Privacy} />
      <MenuStack.Screen name="Charte" component={Charte} />
    </MenuStack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

const TabNavigator = ({ navigation }) => (
  <Tab.Navigator
    lazy
    initialRouteName="Agenda"
    tabBarOptions={{
      activeTintColor: colors.app.color,
      inactiveTintColor: '#ddd',
    }}
    screenOptions={{
      gestureEnabled: false,
    }}>
    <Tab.Screen
      name="Actions"
      component={ActionsNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <AgendaIcon size={size} color={color} />,
        tabBarLabel: 'AGENDA',
      }}
    />
    <Tab.Screen
      name="Territories"
      component={TerritoriesNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <TerritoryIcon size={size} color={color} />,
        tabBarLabel: 'TERRITOIRES',
      }}
    />
    <Tab.Screen
      name="Persons"
      component={PersonsNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <PersonIcon size={size} color={color} />,
        tabBarLabel: 'USAGERS',
      }}
    />
    <Tab.Screen
      name="Structures"
      component={StructuresNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <StructuresIcon size={size} color={color} />,
        tabBarLabel: 'STRUCTURES',
      }}
    />
    <Tab.Screen
      name="Profil"
      component={MenuNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <MenuIcon size={size} color={color} />,
        tabBarLabel: 'PROFIL',
      }}
    />
  </Tab.Navigator>
);

const LoginStack = createStackNavigator();
const LoginNavigator = () => (
  <LoginStack.Navigator initialRouteName="Login" headerMode="none">
    <LoginStack.Screen name="Login" component={Login} />
    <LoginStack.Screen name="TeamSelection" component={TeamSelection} />
    <LoginStack.Screen name="CharteAcceptance" component={CharteAcceptance} />
    <LoginStack.Screen name="ForceChangePassword" component={ForceChangePassword} />
    <LoginStack.Screen name="ForgetPassword" component={ForgetPassword} />
  </LoginStack.Navigator>
);

const AppStack = createStackNavigator();

class App extends React.Component {
  async componentDidMount() {
    AppState.addEventListener('change', this.onAppChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('focus', this.onAppChange);
  }

  appState = AppState.currentState;
  onAppChange = (nextAppState) => {
    if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
      if (API.token) API.get({ path: '/check-auth' }); // will force logout if session is expired
    }
    this.appState = nextAppState;
  };

  render() {
    return (
      <ActionSheetProvider>
        <RootContextsProvider>
          <ActionsByStatusProvider>
            <StructuresProvider>
              <PersonsSelectorsProvider>
                <NavigationContainer ref={this.containerRef}>
                  <AppStack.Navigator headerMode="none" initialRouteName="LoginStack" screenOptions={{ gestureEnabled: false }}>
                    <AppStack.Screen name="LoginStack" component={LoginNavigator} />
                    <AppStack.Screen name="Home" component={TabNavigator} />
                    <AppStack.Screen name="Persons" component={PersonsNavigator} />
                    <AppStack.Screen name="Actions" component={ActionsNavigator} />
                  </AppStack.Navigator>
                  <EnvironmentIndicator />
                </NavigationContainer>
              </PersonsSelectorsProvider>
            </StructuresProvider>
          </ActionsByStatusProvider>
        </RootContextsProvider>
      </ActionSheetProvider>
    );
  }
}

export default App;
