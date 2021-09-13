import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Row from '../../components/Row';
import FileSocial from './FileSocial';
import FileMedical from './FileMedical';
import ScrollContainer from '../../components/ScrollContainer';
import Spacer from '../../components/Spacer';

const FoldersStack = createStackNavigator();

const FoldersNavigator = (props) => (
  <FoldersStack.Navigator headerMode="none" initialRouteName="FoldersSummary">
    <FoldersStack.Screen name="FoldersSummary">
      {(stackProps) => <FoldersSummary {...props} {...stackProps} />}
    </FoldersStack.Screen>
    <FoldersStack.Screen name="FileSocial">
      {(stackProps) => <FileSocial {...props} {...stackProps} />}
    </FoldersStack.Screen>
    <FoldersStack.Screen name="FileMedical">
      {(stackProps) => <FileMedical {...props} {...stackProps} />}
    </FoldersStack.Screen>
  </FoldersStack.Navigator>
);

export default FoldersNavigator;

const FoldersSummary = ({ navigation }) => (
  <ScrollContainer noPadding>
    <Spacer />
    <Row
      withNextButton
      caption="Dossier social"
      onPress={() => navigation.navigate('FileSocial')}
    />
    <Row
      withNextButton
      caption="Dossier médical"
      onPress={() => navigation.navigate('FileMedical')}
    />
    <Row withNextButton caption="Démarches" onPress={() => console.log('Démarches')} />
  </ScrollContainer>
);
