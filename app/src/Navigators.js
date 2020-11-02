import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AgendaIcon, StructuresIcon, PersonIcon, MenuIcon } from './icons';
import Login from './scenes/Login/Login';
import ActionsList from './scenes/Actions/ActionsList';
import Action from './scenes/Actions/Action';
import NewActionForm from './scenes/Actions/NewActionForm';
import PersonsList from './scenes/Persons/PersonsList';
import PersonsSearch from './scenes/Persons/PersonsSearch';
import NewPersonForm from './scenes/Persons/NewPersonForm';
import Person from './scenes/Persons/Person';
import StructuresList from './scenes/Structures/StructuresList';
import NewStructureForm from './scenes/Structures/NewStructureForm';
import Structure from './scenes/Structures/Structure';
import NewCommentForm from './scenes/Comments/NewCommentForm';
import Comment from './scenes/Comments/Comment';
import Place from './scenes/Places/Place';
import NewPlaceForm from './scenes/Places/NewPlaceForm';
import Menu from './scenes/Menu/Menu';
import colors from './utils/colors';
import ChooseTeam from './scenes/Menu/ChooseTeam';

const PersonStack = {
  Person,
  PersonsSearch,
  NewPersonForm,
  PersonPlace: Place,
  NewPersonPlaceForm: NewPlaceForm,
  PersonComment: Comment,
  NewPersonCommentForm: NewCommentForm,
};

const ActionStack = {
  Action,
  NewActionForm,
  ActionComment: Comment,
  NewActionCommentForm: NewCommentForm,
};

const ActionsStack = createStackNavigator();
const ActionsNavigator = () => {
  return (
    <ActionsStack.Navigator headerMode="none" initialRouteName="ActionsList">
      <ActionsStack.Screen name="ActionsList" component={ActionsList} />
      {Object.entries(ActionStack).map(([name, component]) => (
        <ActionsStack.Screen key={name} name={name} component={component} />
      ))}
      {/* Person stack */}
      {Object.entries(PersonStack).map(([name, component]) => (
        <ActionsStack.Screen key={name} name={name} component={component} />
      ))}
    </ActionsStack.Navigator>
  );
};

const PersonsStack = createStackNavigator();
const PersonsNavigator = () => {
  return (
    <PersonsStack.Navigator headerMode="none" initialRouteName="PersonsList">
      <PersonsStack.Screen name="PersonsList" component={PersonsList} />
      {Object.entries(PersonStack).map(([name, component]) => (
        <ActionsStack.Screen key={name} name={name} component={component} />
      ))}
      {Object.entries(ActionStack).map(([name, component]) => (
        <ActionsStack.Screen key={name} name={name} component={component} />
      ))}
    </PersonsStack.Navigator>
  );
};

const StrcturesStack = createStackNavigator();
const StrcturesNavigator = () => {
  return (
    <StrcturesStack.Navigator headerMode="none" initialRouteName="StructuresList">
      <StrcturesStack.Screen name="StructuresList" component={StructuresList} />
      <StrcturesStack.Screen name="NewStructureForm" component={NewStructureForm} />
      <StrcturesStack.Screen name="Structure" component={Structure} />
    </StrcturesStack.Navigator>
  );
};

const MenuStack = createStackNavigator();
const MenuNavigator = () => {
  return (
    <MenuStack.Navigator headerMode="none" initialRouteName="Menu">
      <MenuStack.Screen name="Menu" component={Menu} />
      <MenuStack.Screen name="ChooseTeam" component={ChooseTeam} />
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
      name="Persons"
      component={PersonsNavigator}
      options={{
        tabBarIcon: ({ size, color }) => <PersonIcon size={size} color={color} />,
        tabBarLabel: 'USAGERS',
      }}
    />
    <Tab.Screen
      name="Structures"
      component={StrcturesNavigator}
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
  </LoginStack.Navigator>
);

const AppStack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <AppStack.Navigator
        headerMode="none"
        initialRouteName="LoginStack"
        screenOptions={{ gestureEnabled: false }}>
        <AppStack.Screen name="LoginStack" component={LoginNavigator} />
        <AppStack.Screen name="Home" component={TabNavigator} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
};

export default App;
