import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useRecoilValue } from 'recoil';
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

const NewPersonForm = ({ navigation, route }) => {
  const [persons, setPersons] = useRecoilValue(personsState);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);

  const [name, setName] = useState('');
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
    if (existingPerson) return { ok: false, error: 'Un utilisateur existe déjà à ce nom' };
    const response = await API.post({
      path: '/person',
      body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)({ name }),
    });
    if (response.ok) {
      setPersons((persons) => [response.decryptedData, ...persons].sort((p1, p2) => p1.name.localeCompare(p2.name)));
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
  }, []);

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
    <SceneContainer>
      <ScreenTitle title="Ajouter une personne" onBack={onGoBackRequested} />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <InputLabelled label="Pseudo" onChangeText={setName} value={name} placeholder="Monsieur X" autoCapitalize="words" />
          <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateUserRequest} loading={posting} />
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewPersonForm;
