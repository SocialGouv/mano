import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import InputFromSearchList from '../../components/InputFromSearchList';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import ActionStatusSelect from '../../components/Selects/ActionStatusSelect';
import Label from '../../components/Label';
import Tags from '../../components/Tags';
import { MyText } from '../../components/MyText';
import { actionsState, prepareActionForEncryption, TODO } from '../../recoil/actions';
import { currentTeamState, userState } from '../../recoil/auth';
import { personsState } from '../../recoil/persons';
import API from '../../services/api';
import ActionCategoriesMultiCheckboxes from '../../components/MultiCheckBoxes/ActionCategoriesMultiCheckboxes';
import CheckboxLabelled from '../../components/CheckboxLabelled';

const NewActionForm = ({ route, navigation }) => {
  const setActions = useSetRecoilState(actionsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const allPersons = useRecoilValue(personsState);
  const [name, setName] = useState('');
  const [dueAt, setDueAt] = useState(null);
  const [withTime, setWithTime] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [persons, setPersons] = useState(route.params?.person ? [route.params?.person] : []);
  const [categories, setCategories] = useState([]);
  const forCurrentPerson = useRef(!!route.params?.person).current;
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(TODO);

  const backRequestHandledRef = useRef(null);

  useEffect(() => {
    const handleBeforeRemove = (e) => {
      if (backRequestHandledRef.current) return;
      e.preventDefault();
      onGoBackRequested();
    };

    const handleFocus = () => {
      const newPerson = route?.params?.person;
      if (newPerson) {
        setPersons((persons) => [...persons.filter((p) => p !== newPerson), newPerson]);
      }
    };
    const focusListenerUnsubscribe = navigation.addListener('focus', handleFocus);
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      focusListenerUnsubscribe();
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, route?.params?.person]);

  const onSearchPerson = () => navigation.push('PersonsSearch', { fromRoute: 'NewActionForm' });

  const onCreateAction = async () => {
    setPosting(true);
    let newAction = null;
    const actions = [];
    for (const person of persons) {
      const response = await API.post({
        path: '/action',
        body: prepareActionForEncryption({
          name,
          person,
          team: currentTeam._id,
          dueAt,
          withTime,
          urgent,
          status,
          categories,
          user: user._id,
          completedAt: status !== TODO ? new Date().toISOString() : null,
        }),
      });
      if (!response.ok) {
        setPosting(false);
        Alert.alert(response.error || response.code);
        return;
      }
      if (!newAction) newAction = response.decryptedData;
      setActions((actions) => [response.decryptedData, ...actions]);
      actions.push(response.decryptedData);
    }
    // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
    backRequestHandledRef.current = true;
    Sentry.setContext('action', { _id: newAction._id });
    navigation.navigate('Action', {
      fromRoute: route.params.fromRoute,
      actions,
      ...newAction,
      editable: true,
    });
    setTimeout(() => setPosting(false), 250);
  };

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.navigate(route.params.fromRoute);
  };

  const canGoBack = useMemo(() => {
    if (!name.length && (forCurrentPerson || !persons.length) && !dueAt) return true;
    return false;
  }, [name, forCurrentPerson, persons, dueAt]);

  const isReadyToSave = useMemo(() => {
    if (!name || !name.length || !name.trim().length) return false;
    if (!persons.length) return false;
    if (!dueAt) return false;
    return true;
  }, [name, dueAt, persons]);

  const onGoBackRequested = () => {
    if (canGoBack) return onBack();
    if (isReadyToSave) {
      Alert.alert('Voulez-vous enregistrer cette action ?', null, [
        {
          text: 'Enregistrer',
          onPress: onCreateAction,
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
      return;
    }
    Alert.alert('Voulez-vous abandonner la création de cette action ?', null, [
      {
        text: 'Continuer la création',
      },
      {
        text: 'Abandonner',
        onPress: onBack,
        style: 'destructive',
      },
    ]);
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Nouvelle action" onBack={onGoBackRequested} testID="new-action" />
      <ScrollContainer keyboardShouldPersistTaps="handled" testID="new-action-form">
        <View>
          <InputLabelled label="Nom de l’action" onChangeText={setName} value={name} placeholder="Rdv chez le dentiste" testID="new-action-name" />
          {forCurrentPerson ? (
            <InputFromSearchList
              label="Personne concernée"
              value={allPersons.find((p) => p._id === persons[0])?.name || '-- Aucune --'}
              onSearchRequest={onSearchPerson}
              disabled
            />
          ) : (
            <>
              <Label label="Personne(s) concerné(es)" />
              <Tags
                data={persons}
                onChange={setPersons}
                editable
                onAddRequest={onSearchPerson}
                renderTag={(person) => <MyText>{allPersons.find((p) => p._id === person)?.name}</MyText>}
              />
            </>
          )}
          <ActionStatusSelect onSelect={setStatus} value={status} editable testID="new-action-status" />
          <DateAndTimeInput
            label="Échéance"
            setDate={setDueAt}
            date={dueAt}
            showTime
            showDay
            withTime={withTime}
            setWithTime={setWithTime}
            testID="new-action-dueAt"
          />
          <ActionCategoriesMultiCheckboxes onChange={setCategories} values={categories} editable />
          <CheckboxLabelled
            label="Action prioritaire (cette action sera mise en avant par rapport aux autres)"
            alone
            onPress={() => setUrgent(!urgent)}
            value={urgent}
          />
          <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateAction} loading={posting} testID="new-action-create" />
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewActionForm;
