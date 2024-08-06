import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import PersonSummary from './PersonSummary';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import FoldersNavigator from './FoldersNavigator';
import Tabs from '../../components/Tabs';
import colors from '../../utils/colors';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  allowedPersonFieldsInHistorySelector,
  personsState,
  usePreparePersonForEncryption,
  flattenedCustomFieldsPersonsSelector,
} from '../../recoil/persons';
import { actionsState, prepareActionForEncryption } from '../../recoil/actions';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { userState } from '../../recoil/auth';
import API from '../../services/api';
import { rencontresState } from '../../recoil/rencontres';
import { passagesState } from '../../recoil/passages';
import { consultationsState } from '../../recoil/consultations';
import { treatmentsState } from '../../recoil/treatments';
import { medicalFileState } from '../../recoil/medicalFiles';
import { refreshTriggerState } from '../../components/Loader';
import { groupsState, prepareGroupForEncryption } from '../../recoil/groups';

const TabNavigator = createMaterialTopTabNavigator();

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

const Person = ({ route, navigation }) => {
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const allowedFieldsInHistory = useRecoilValue(allowedPersonFieldsInHistorySelector);
  const preparePersonForEncryption = usePreparePersonForEncryption();
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const [persons, setPersons] = useRecoilState(personsState);
  const actions = useRecoilValue(actionsState);
  const groups = useRecoilValue(groupsState);
  const comments = useRecoilValue(commentsState);
  const passages = useRecoilValue(passagesState);
  const rencontres = useRecoilValue(rencontresState);
  const consultations = useRecoilValue(consultationsState);
  const treatments = useRecoilValue(treatmentsState);
  const medicalFiles = useRecoilValue(medicalFileState);
  const relsPersonPlace = useRecoilValue(relsPersonPlaceState);
  const user = useRecoilValue(userState);

  const personDB = useMemo(() => persons.find((p) => p._id === route.params?.person?._id), [persons, route.params?.person?._id]);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused && refreshTrigger.status !== true) {
      setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
    }
  }, [isFocused]);

  const castToPerson = useCallback(
    (person = {}) => {
      const toReturn = {};
      for (const field of flattenedCustomFieldsPersons || []) {
        toReturn[field.name] = cleanValue(person[field.name]);
      }
      return {
        ...toReturn,
        name: person.name,
        otherNames: person.otherNames,
        birthdate: person.birthdate,
        alertness: person.alertness,
        wanderingAt: person.wanderingAt,
        followedSince: person.followedSince || person.createdAt,
        createdAt: person.createdAt,
        gender: person.gender,
        phone: person.phone?.trim(),
        description: person.description?.trim(),
        vulnerabilities: person.vulnerabilities,
        consumptions: person.consumptions,
        assignedTeams: person.assignedTeams,
        entityKey: person.entityKey,
        outOfActiveList: person.outOfActiveList,
        outOfActiveListReasons: person.outOfActiveListReasons,
        documents: person.documents,
        history: person.history,
      };
    },
    [flattenedCustomFieldsPersons]
  );

  const [person, setPerson] = useState(castToPerson(personDB));
  const [writingComment, setWritingComment] = useState('');
  const [editable, setEditable] = useState(route?.params?.editable || false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
  }, [navigation, route?.params?.person]);

  useFocusEffect(
    useCallback(() => {
      setPerson(castToPerson(personDB));
    }, [personDB, castToPerson])
  );

  const onEdit = () => setEditable((e) => !e);

  const onChange = (newPersonState, forceUpdate = false) => {
    setPerson((p) => ({ ...p, ...newPersonState }));
    if (forceUpdate) onUpdatePerson(false, newPersonState);
  };

  const onUpdatePerson = async (alert = true, stateToMerge = {}) => {
    const personToUpdate = Object.assign({}, castToPerson(person), stateToMerge, {
      _id: personDB._id,
    });
    const oldPerson = persons.find((a) => a._id === personDB._id);
    const existingPerson = persons.find((p) => personDB._id !== p._id && p.name === personToUpdate.name);
    if (existingPerson) return Alert.alert('Une personne existe déjà à ce nom');

    setUpdating(true);

    const historyEntry = {
      date: new Date(),
      user: user._id,
      data: {},
    };
    for (const key in personToUpdate) {
      if (!allowedFieldsInHistory.includes(key)) continue;
      if (personToUpdate[key] !== oldPerson[key]) historyEntry.data[key] = { oldValue: oldPerson[key], newValue: personToUpdate[key] };
    }
    if (!!Object.keys(historyEntry.data).length) personToUpdate.history = [...(oldPerson.history || []), historyEntry];

    const response = await API.put({
      path: `/person/${personDB._id}`,
      body: preparePersonForEncryption(personToUpdate),
    });
    if (response.error) {
      Alert.alert(response.error);
      setUpdating(false);
      return false;
    }
    const newPerson = response.decryptedData;
    setPersons((persons) =>
      persons.map((p) => {
        if (p._id === personDB._id) return newPerson;
        return p;
      })
    );
    setPerson(castToPerson(newPerson));
    if (alert) Alert.alert('Personne mise à jour !');
    setUpdating(false);
    setEditable(false);
    return true;
  };

  const onDelete = async () => {
    setDeleting(true);
    const personId = personDB._id;
    if (
      !user.healthcareProfessional &&
      (!!medicalFiles.find((c) => c.person === personId) ||
        !!treatments.find((c) => c.person === personId) ||
        !!consultations.find((c) => c.person === personId))
    ) {
      const keepGoing = await new Promise((res) => {
        Alert.alert(
          'Voulez-vous continuer la suppression ?',
          'Des données médicales sont associées à cette personne. Si vous la supprimez, ces données seront également effacées. Vous n’avez pas accès à ces données médicales car vous n’êtes pas un·e professionnel·le de santé. Voulez-vous supprimer cette personne et toutes ses données ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => res(false) },
            { text: 'Continuer', style: 'destructive', onPress: () => res(true) },
          ]
        );
      });
      if (!keepGoing) {
        setDeleting(false);
        return false;
      }
    }

    const body = {
      // groupToUpdate: undefined,
      // groupIdToDelete: undefined,
      actionsToTransfer: [],
      commentsToTransfer: [],
      actionIdsToDelete: [],
      commentIdsToDelete: [],
      passageIdsToDelete: [],
      rencontreIdsToDelete: [],
      consultationIdsToDelete: [],
      treatmentIdsToDelete: [],
      medicalFileIdsToDelete: [],
      relsPersonPlaceIdsToDelete: [],
    };

    const group = groups.find((g) => g.persons.includes(personId));
    if (group) {
      const updatedGroup = {
        ...group,
        persons: group.persons.filter((p) => p !== personDB._id),
        relations: group.relations.filter((r) => !r.persons.includes(personDB._id)),
      };
      const personTransferId = group.persons.find((p) => p !== personDB._id);
      if (updatedGroup.relations.length === 0) {
        body.groupIdToDelete = group._id;
      } else {
        body.groupToUpdate = await encryptItem(prepareGroupForEncryption(updatedGroup));
      }

      if (personTransferId) {
        body.actionsToTransfer = await Promise.all(
          actions
            .filter((a) => a.person === personDB._id && a.group === true)
            .map((action) => {
              return prepareActionForEncryption({
                ...action,
                person: personTransferId,
                user: action.user || user._id,
              });
            })
            .map(API.encryptItem)
        );

        body.commentsToTransfer = await Promise.all(
          comments
            .filter((c) => c.person === personDB._id && c.group === true)
            .map((comment) => prepareCommentForEncryption({ ...comment, person: personTransferId }))
            .map(API.encryptItem)
        );
      }
    }
    const actionIdsToDelete = actions.filter((a) => a.group === false && a.person === personDB._id).map((a) => a._id);
    const commentIdsToDelete = comments
      .filter((c) => {
        if (c.group) return false;
        if (actionIdsToDelete.includes(c.action)) return true;
        if (c.person === personDB._id) return true;
        return false;
      })
      .map((c) => c._id);
    body.actionIdsToDelete = actionIdsToDelete;
    body.commentIdsToDelete = commentIdsToDelete;
    body.relsPersonPlaceIdsToDelete = relsPersonPlace.filter((rel) => rel.person === personDB._id).map((rel) => rel._id);
    body.passageIdsToDelete = passages.filter((c) => c.person === personDB._id).map((c) => c._id);
    body.rencontreIdsToDelete = rencontres.filter((c) => c.person === personDB._id).map((c) => c._id);
    body.consultationIdsToDelete = consultations.filter((c) => c.person === personDB._id).map((c) => c._id);
    body.treatmentIdsToDelete = treatments.filter((c) => c.person === personDB._id).map((c) => c._id);
    body.medicalFileIdsToDelete = medicalFiles.filter((c) => c.person === personDB._id).map((c) => c._id);

    const personRes = await API.delete({ path: `/person/${personDB._id}`, body });
    if (personRes?.ok) {
      Alert.alert('Personne supprimée !');
      setPersons((persons) => persons.filter((p) => p._id !== personDB._id));
      setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
    }
    return true;
  };

  const isUpdateDisabled = useMemo(() => {
    if (deleting) return true;
    const newPerson = {
      ...personDB,
      ...castToPerson(person),
    };
    if (JSON.stringify(castToPerson(personDB)) !== JSON.stringify(castToPerson(newPerson))) return false;
    return true;
  }, [personDB, castToPerson, person, deleting]);

  const onBack = () => {
    backRequestHandledRef.current = true;
    Sentry.setContext('person', {});
    route.params?.fromRoute ? navigation.navigate(route.params.fromRoute) : navigation.goBack();
  };

  const onGoBackRequested = async () => {
    if (writingComment.length) {
      const goToNextStep = await new Promise((res) =>
        Alert.alert("Vous êtes en train d'écrire un commentaire, n'oubliez pas de cliquer sur créer !", null, [
          {
            text: "Oui c'est vrai !",
            onPress: () => res(false),
          },
          {
            text: 'Ne pas enregistrer ce commentaire',
            onPress: () => res(true),
            style: 'destructive',
          },
          {
            text: 'Annuler',
            onPress: () => res(false),
            style: 'cancel',
          },
        ])
      );
      if (!goToNextStep) return;
    }
    if (isUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer les mises-à-jour sur cette personne ?', null, [
      {
        text: 'Enregistrer',
        onPress: onUpdatePerson,
      },
      {
        text: 'Ne pas enregistrer',
        style: 'destructive',
        onPress: onBack,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  return (
    <>
      <SceneContainer backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey} testID="person">
        <ScreenTitle
          title={person.name}
          onBack={onGoBackRequested}
          onEdit={!editable ? onEdit : null}
          onSave={!editable || isUpdateDisabled ? null : onUpdatePerson}
          saving={updating}
          backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey}
          testID="person"
        />
        <TabNavigator.Navigator
          tabBar={(props) => (
            <Tabs
              numberOfTabs={2}
              {...props}
              backgroundColor={!person?.outOfActiveList ? colors.app.backgroundColor : colors.app.colorBackgroundDarkGrey}
            />
          )}
          removeClippedSubviews={Platform.OS === 'android'}
          screenOptions={{ swipeEnabled: true }}>
          <TabNavigator.Screen lazy name="Summary" options={{ tabBarLabel: 'Résumé' }}>
            {() => (
              <PersonSummary
                navigation={navigation}
                route={route}
                person={person}
                personDB={personDB}
                backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey}
                onChange={onChange}
                onUpdatePerson={onUpdatePerson}
                onCommentWrite={setWritingComment}
                onEdit={onEdit}
                onDelete={onDelete}
                onBack={onBack}
                isUpdateDisabled={isUpdateDisabled}
                updating={updating}
                editable={editable}
              />
            )}
          </TabNavigator.Screen>
          <TabNavigator.Screen lazy name="Folders" options={{ tabBarLabel: 'Dossiers' }}>
            {() => (
              <FoldersNavigator
                navigation={navigation}
                route={route}
                person={person}
                personDB={personDB}
                backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey}
                onChange={onChange}
                onUpdatePerson={onUpdatePerson}
                onEdit={onEdit}
                isUpdateDisabled={isUpdateDisabled}
                editable={editable}
                updating={updating}
              />
            )}
          </TabNavigator.Screen>
        </TabNavigator.Navigator>
      </SceneContainer>
    </>
  );
};

export default Person;
