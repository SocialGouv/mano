import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import API from '../../services/api';
import ActionCategoriesModalSelect from '../../components/ActionCategoriesModalSelect';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import useCreateReportAtDateIfNotExist from '../../utils/useCreateReportAtDateIfNotExist';
import { dayjsInstance } from '../../services/dateDayjs';
import { groupsState } from '../../recoil/groups';
import { useFocusEffect } from '@react-navigation/native';

const NewActionForm = ({ route, navigation }) => {
  const setActions = useSetRecoilState(actionsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const groups = useRecoilValue(groupsState);
  const user = useRecoilValue(userState);
  const [name, setName] = useState('');
  const [dueAt, setDueAt] = useState(null);
  const [withTime, setWithTime] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [group, setGroup] = useState(false);
  const [actionPersons, setActionPersons] = useState(() => (route.params?.person ? [route.params?.person] : []));
  const [categories, setCategories] = useState([]);
  const forCurrentPerson = useRef(!!route.params?.person).current;
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(TODO);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const backRequestHandledRef = useRef(null);
  useEffect(() => {
    const handleBeforeRemove = (e) => {
      if (backRequestHandledRef.current) return;
      e.preventDefault();
      onGoBackRequested();
    };
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const newPerson = route?.params?.person;
      if (newPerson) {
        setActionPersons((actionPersons) => [...actionPersons.filter((p) => p._id !== newPerson._id), newPerson]);
      }
    }, [route?.params?.person])
  );

  const onSearchPerson = () => navigation.push('PersonsSearch', { fromRoute: 'NewActionForm' });

  const onCreateAction = async () => {
    setPosting(true);
    let newAction = null;
    const actions = [];
    for (const person of actionPersons) {
      const response = await API.post({
        path: '/action',
        body: prepareActionForEncryption({
          name,
          person: person._id,
          teams: [currentTeam._id],
          dueAt,
          withTime,
          urgent,
          group,
          status,
          categories,
          user: user._id,
          completedAt: status !== TODO ? new Date().toISOString() : null,
        }),
      });
      if (!response.ok) {
        setPosting(false);
        if (response.status !== 401) Alert.alert(response.error || response.code);
        return;
      }
      if (!newAction) newAction = response.decryptedData;
      setActions((actions) => [response.decryptedData, ...actions]);
      actions.push(response.decryptedData);
    }
    await createReportAtDateIfNotExist(newAction.createdAt);
    if (!!newAction.completedAt) {
      if (dayjsInstance(newAction.completedAt).format('YYYY-MM-DD') !== dayjsInstance(newAction.createdAt).format('YYYY-MM-DD')) {
        await createReportAtDateIfNotExist(newAction.completedAt);
      }
    }
    // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
    backRequestHandledRef.current = true;
    Sentry.setContext('action', { _id: newAction._id });
    navigation.replace('Action', {
      actions,
      action: newAction,
      editable: true,
    });
    setTimeout(() => setPosting(false), 250);
  };

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
  };

  const canGoBack = useMemo(() => {
    if (!name.length && (forCurrentPerson || !actionPersons.length) && !dueAt) return true;
    return false;
  }, [name, forCurrentPerson, actionPersons, dueAt]);

  const isReadyToSave = useMemo(() => {
    if (!name || !name.length || !name.trim().length) return false;
    if (!actionPersons.length) return false;
    if (!dueAt) return false;
    return true;
  }, [name, dueAt, actionPersons]);

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

  const isOnePerson = actionPersons?.length === 1;
  const person = !isOnePerson ? null : actionPersons?.[0];
  const canToggleGroupCheck = !!organisation.groupsEnabled && !!person && groups.find((group) => group.persons.includes(person._id));

  return (
    <SceneContainer>
      <ScreenTitle title="Nouvelle action" onBack={onGoBackRequested} testID="new-action" />
      <ScrollContainer keyboardShouldPersistTaps="handled" testID="new-action-form">
        <View>
          <InputLabelled label="Nom de l’action" onChangeText={setName} value={name} placeholder="Rdv chez le dentiste" testID="new-action-name" />
          {forCurrentPerson ? (
            <InputFromSearchList
              label="Personne concernée"
              value={actionPersons[0]?.name || '-- Aucune --'}
              onSearchRequest={onSearchPerson}
              disabled
            />
          ) : (
            <>
              <Label label="Personne(s) concerné(es)" />
              <Tags
                data={actionPersons}
                onChange={setActionPersons}
                editable
                onAddRequest={onSearchPerson}
                renderTag={(person) => <MyText>{person?.name}</MyText>}
              />
            </>
          )}
          <ActionStatusSelect onSelect={setStatus} value={status} editable testID="new-action-status" />
          <DateAndTimeInput
            label="À faire le"
            setDate={setDueAt}
            date={dueAt}
            showTime
            showDay
            withTime={withTime}
            setWithTime={setWithTime}
            testID="new-action-dueAt"
          />
          <ActionCategoriesModalSelect withMostUsed onChange={setCategories} values={categories} editable />
          <CheckboxLabelled
            label="Action prioritaire (cette action sera mise en avant par rapport aux autres)"
            alone
            onPress={() => setUrgent(!urgent)}
            value={urgent}
          />
          {!!canToggleGroupCheck && (
            <CheckboxLabelled
              label="Action familiale (cette action sera à effectuer pour toute la famille)"
              alone
              onPress={() => setGroup(!group)}
              value={group}
            />
          )}
          <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateAction} loading={posting} testID="new-action-create" />
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewActionForm;
