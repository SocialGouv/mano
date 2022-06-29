import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import API from '../../services/api';
import TeamsMultiCheckBoxes from '../../components/MultiCheckBoxes/TeamsMultiCheckBoxes';
import { currentTeamState, teamsState } from '../../recoil/auth';
import { sortByName } from '../../utils/sortByName';

const NewPersonForm = ({ navigation, route }) => {
  const [persons, setPersons] = useRecoilState(personsState);
  console.log({ persons });
  const currentTeam = useRecoilValue(currentTeamState);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const teams = useRecoilValue(teamsState);

  const [name, setName] = useState('');
  const [assignedTeams, setAssignedTeams] = useState([currentTeam?._id]);
  const [posting, setPosting] = useState(false);

  const backRequestHandledRef = useRef(null);
  const handleBeforeRemove = (e) => {
    if (backRequestHandledRef.current === true) return;
    e.preventDefault();
    onGoBackRequested();
  };

  useEffect(() => {
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateUserRequest = async () => {
    Keyboard.dismiss();
    const response = await onCreateUser();
    if (response.ok) {
      backRequestHandledRef.current = true; // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
      Sentry.setContext('person', { _id: response.data._id });
      navigation.navigate(route.params.toRoute, {
        fromRoute: route.params.fromRoute,
        _id: response.data._id,
        person: response.data,
        editable: true,
      });
      setTimeout(() => setPosting(false), 250);
    }
  };

  const onCreateUser = async () => {
    setPosting(true);
    const existingPerson = persons.find((p) => p.name === name);
    if (existingPerson) {
      Alert.alert('Une personne suivie existe déjà avec ce nom', 'Veuillez choisir un autre nom');
      setPosting(false);
      return false;
    }
    const response = await API.post({
      path: '/person',
      body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)({ name, followedSince: new Date(), assignedTeams }),
    });
    if (response.ok) {
      setPersons((persons) =>
        [response.decryptedData, ...persons].map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt })).sort(sortByName)
      );
    }
    if (!response.ok) {
      setPosting(false);
      if (response.code === 'USER_ALREADY_EXIST') {
        Alert.alert('Une personne suivie existe déjà avec ce nom', 'Veuillez choisir un autre nom');
      } else {
        Alert.alert(response.error);
      }
      return false;
    }
    return response;
  };

  const isReadyToSave = useMemo(() => {
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  }, [name]);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.navigate(route.params.fromRoute);
    setTimeout(() => setPosting(false), 250);
  };

  const onGoBackRequested = () => {
    if (!isReadyToSave) return onBack();
    Alert.alert('Voulez-vous enregistrer cette personne ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const response = await onCreateUser();
          if (response.ok) onBack();
        },
      },
      {
        text: 'Ne pas enregistrer',
        onPress: onBack,
        style: 'destructive',
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  return (
    <SceneContainer testID="new-person-form">
      <ScreenTitle title="Ajouter une personne" onBack={onGoBackRequested} testID="new-person" />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <InputLabelled
            label="Pseudo"
            onChangeText={setName}
            value={name}
            placeholder="Monsieur X"
            autoCapitalize="words"
            testID="new-person-pseudo"
          />
          <TeamsMultiCheckBoxes
            editable
            values={teams.filter((t) => assignedTeams.includes(t._id)).map((t) => t.name)}
            onChange={(newAssignedTeams) => {
              setAssignedTeams(newAssignedTeams.map((teamName) => teams.find((t) => t.name === teamName)?._id));
            }}
          />
          <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateUserRequest} loading={posting} testID="new-person-create" />
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewPersonForm;
