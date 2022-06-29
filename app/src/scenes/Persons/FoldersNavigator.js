import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Row from '../../components/Row';
import InformationsSocial from './InformationsSocial';
import InformationsMedical from './InformationsMedical';
import ScrollContainer from '../../components/ScrollContainer';
import Spacer from '../../components/Spacer';
import colors from '../../utils/colors';
import Documents from './Documents';
import MedicalFile from './MedicalFile';

const FoldersStack = createStackNavigator();

const FoldersNavigator = (props) => (
  <FoldersStack.Navigator headerMode="none" initialRouteName="FoldersSummary">
    <FoldersStack.Screen name="FoldersSummary">{(stackProps) => <FoldersSummary {...props} {...stackProps} />}</FoldersStack.Screen>
    <FoldersStack.Screen name="InformationsSocial">{(stackProps) => <InformationsSocial {...props} {...stackProps} />}</FoldersStack.Screen>
    <FoldersStack.Screen name="InformationsMedical">{(stackProps) => <InformationsMedical {...props} {...stackProps} />}</FoldersStack.Screen>
    <FoldersStack.Screen name="Documents">{(stackProps) => <Documents {...props} {...stackProps} />}</FoldersStack.Screen>
    <FoldersStack.Screen name="MedicalFile">{(stackProps) => <MedicalFile {...props} {...stackProps} />}</FoldersStack.Screen>
  </FoldersStack.Navigator>
);

export default FoldersNavigator;

const FoldersSummary = ({ navigation, backgroundColor }) => (
  <ScrollContainer noPadding backgroundColor={backgroundColor || colors.app.color}>
    <Spacer />
    <Row withNextButton caption="Informations sociales" onPress={() => navigation.navigate('InformationsSocial')} />
    <Row withNextButton caption="Informations médicales" onPress={() => navigation.navigate('InformationsMedical')} />
    <Row withNextButton caption="Documents" onPress={() => navigation.navigate('Documents')} />
    <Spacer />
    <Row withNextButton caption="🩺   Dossier médical" onPress={() => navigation.navigate('MedicalFile')} />
  </ScrollContainer>
);
