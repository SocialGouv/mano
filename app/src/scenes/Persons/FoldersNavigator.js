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
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/auth';

const FoldersStack = createStackNavigator();

const FoldersNavigator = (props) => {
  const user = useRecoilValue(userState);
  return (
    <FoldersStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FoldersSummary">
      <FoldersStack.Screen name="FoldersSummary">{(stackProps) => <FoldersSummary {...props} {...stackProps} />}</FoldersStack.Screen>
      <FoldersStack.Screen name="InformationsSocial">{(stackProps) => <InformationsSocial {...props} {...stackProps} />}</FoldersStack.Screen>
      <FoldersStack.Screen name="InformationsMedical">{(stackProps) => <InformationsMedical {...props} {...stackProps} />}</FoldersStack.Screen>
      <FoldersStack.Screen name="Documents">{(stackProps) => <Documents {...props} {...stackProps} />}</FoldersStack.Screen>
      {!!user?.healthcareProfessional && (
        <FoldersStack.Screen name="MedicalFile">{(stackProps) => <MedicalFile {...props} {...stackProps} />}</FoldersStack.Screen>
      )}
    </FoldersStack.Navigator>
  );
};

export default FoldersNavigator;

const FoldersSummary = ({ navigation, backgroundColor }) => {
  const user = useRecoilValue(userState);
  return (
    <ScrollContainer noPadding backgroundColor={backgroundColor || colors.app.color}>
      <Spacer />
      <Row withNextButton caption="Informations sociales" onPress={() => navigation.navigate('InformationsSocial')} />
      <Row withNextButton caption="Informations médicales" onPress={() => navigation.navigate('InformationsMedical')} />
      <Row withNextButton caption="Documents" onPress={() => navigation.navigate('Documents')} />
      {!!user?.healthcareProfessional && (
        <>
          <Spacer />
          <Row withNextButton caption="🩺   Dossier médical" onPress={() => navigation.navigate('MedicalFile')} />
        </>
      )}
    </ScrollContainer>
  );
};
