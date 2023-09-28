import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Row from '../../components/Row';
import PersonSection from './PersonSection';
import ScrollContainer from '../../components/ScrollContainer';
import Spacer from '../../components/Spacer';
import colors from '../../utils/colors';
import Documents from './Documents';
import MedicalFile from './MedicalFile';
import { useRecoilValue } from 'recoil';
import { organisationState, userState } from '../../recoil/auth';
import Group from './Group';
import { customFieldsPersonsSelector } from '../../recoil/persons';

const FoldersStack = createStackNavigator();

const FoldersNavigator = (props) => {
  const user = useRecoilValue(userState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  return (
    <FoldersStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FoldersSummary">
      <FoldersStack.Screen name="FoldersSummary">{(stackProps) => <FoldersSummary {...props} {...stackProps} />}</FoldersStack.Screen>
      {customFieldsPersons.map(({ name, fields }) => {
        return (
          <FoldersStack.Screen key={name} name={name}>
            {(stackProps) => <PersonSection name={name} fields={fields} {...props} {...stackProps} />}
          </FoldersStack.Screen>
        );
      })}
      <FoldersStack.Screen name="SocialDocuments">{(stackProps) => <Documents {...props} {...stackProps} />}</FoldersStack.Screen>
      <FoldersStack.Screen name="Group">{(stackProps) => <Group {...props} {...stackProps} />}</FoldersStack.Screen>
      {!!user?.healthcareProfessional && (
        <FoldersStack.Screen name="MedicalFile">{(stackProps) => <MedicalFile {...props} {...stackProps} />}</FoldersStack.Screen>
      )}
    </FoldersStack.Navigator>
  );
};

export default FoldersNavigator;

const FoldersSummary = ({ navigation, backgroundColor }) => {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);

  return (
    <ScrollContainer noPadding backgroundColor={backgroundColor || colors.app.color}>
      <Spacer />
      {customFieldsPersons.map(({ name }) => {
        return <Row key={name} withNextButton caption={name} onPress={() => navigation.navigate(name)} />;
      })}
      <Row withNextButton caption="Documents" onPress={() => navigation.navigate('SocialDocuments')} />
      {!!organisation.groupsEnabled && <Row withNextButton caption="Liens Familiaux" onPress={() => navigation.navigate('Group')} />}
      {!!user?.healthcareProfessional && (
        <>
          <Spacer />
          <Row withNextButton caption="🩺   Dossier médical" onPress={() => navigation.navigate('MedicalFile')} />
        </>
      )}
    </ScrollContainer>
  );
};
