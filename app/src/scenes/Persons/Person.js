import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRecoilState, useRecoilValue } from 'recoil';
import PersonSummary from './PersonSummary';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { genders } from '../../components/Selects/GenderSelect';
import FoldersNavigator from './FoldersNavigator';
import Tabs from '../../components/Tabs';
import colors from '../../utils/colors';
import {
  commentForUpdatePerson,
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import { actionsState } from '../../recoil/actions';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import API from '../../services/api';

const TabNavigator = createMaterialTopTabNavigator();

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

const Person = ({ route, navigation }) => {
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);

  const [persons, setPersons] = useRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);

  const personDB = useMemo(() => persons.find((p) => p._id === route.params?._id), [persons, route.params?._id]);

  const castToPerson = useCallback(
    (person = {}) => {
      const toReturn = {};
      for (const field of customFieldsPersonsMedical || []) {
        toReturn[field.name] = cleanValue(person[field.name]);
      }
      for (const field of customFieldsPersonsSocial || []) {
        toReturn[field.name] = cleanValue(person[field.name]);
      }
      return {
        ...toReturn,
        name: person.name || '',
        otherNames: person.otherNames || '',
        birthdate: person.birthdate || null,
        alertness: person.alertness || false,
        wanderingAt: person.wanderingAt || null,
        followedSince: person.followedSince || person.createdAt,
        createdAt: person.createdAt,
        gender: person.gender || genders[0],
        phone: person.phone?.trim() || '',
        description: person.description?.trim() || '',
        personalSituation: person.personalSituation?.trim() || '',
        nationalitySituation: person.nationalitySituation?.trim() || '',
        address: person.address?.trim() || '',
        addressDetail: person.addressDetail?.trim() || '',
        structureSocial: person.structureSocial?.trim() || '',
        employment: person.employment?.trim() || '',
        structureMedical: person.structureMedical?.trim() || '',
        resources: person.resources || [],
        reasons: person.reasons || [],
        healthInsurance: person.healthInsurance?.trim() || '',
        vulnerabilities: person.vulnerabilities || [],
        consumptions: person.consumptions || [],
        assignedTeams: person.assignedTeams || [],
        hasAnimal: person.hasAnimal?.trim() || '',
        entityKey: person.entityKey || '',
        outOfActiveList: person.outOfActiveList || false,
        outOfActiveListReason: person.outOfActiveListReason || '',
        documents: person.documents || [],
      };
    },
    [customFieldsPersonsMedical, customFieldsPersonsSocial]
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

    const handleFocus = () => {
      setPerson(castToPerson(personDB));
    };
    const focusListenerUnsubscribe = navigation.addListener('focus', handleFocus);
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      focusListenerUnsubscribe();
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, route?.params?.person]);

  const onEdit = () => setEditable((e) => !e);

  const onChange = (newPersonState, forceUpdate = false) => {
    setPerson((p) => ({ ...p, ...newPersonState }));
    if (forceUpdate) onUpdatePerson(false, newPersonState);
  };

  const onUpdatePerson = async (alert = true, stateToMerge = {}) => {
    setUpdating(true);
    const personToUpdate = Object.assign({}, castToPerson(person), stateToMerge, {
      _id: personDB._id,
    });
    const oldPerson = persons.find((a) => a._id === personDB._id);
    const response = await API.put({
      path: `/person/${personDB._id}`,
      body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(personToUpdate),
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
    const comment = commentForUpdatePerson({ newPerson, oldPerson });
    if (comment) {
      comment.user = user._id;
      comment.team = currentTeam._id;
      comment.organisation = organisation._id;
      const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
      if (commentResponse.ok) setComments((comments) => [response.decryptedData, ...comments]);
    }
    if (alert) Alert.alert('Personne mise à jour !');
    setUpdating(false);
    setEditable(false);
    return true;
  };

  const onDelete = async () => {
    setDeleting(true);
    const res = await API.delete({ path: `/person/${personDB._id}` });
    if (res.error) {
      if (res.error === 'Not Found') {
        setPersons((persons) => persons.filter((p) => p._id !== personDB._id));
      } else {
        Alert.alert(res.error);
        return false;
      }
    }
    for (const action of actions.filter((a) => a.person === personDB._id)) {
      const actionRes = await API.delete({ path: `/action/${action._id}` });
      if (actionRes.ok) {
        setActions((actions) => actions.filter((a) => a._id !== action._id));
        for (let comment of comments.filter((c) => c.action === action._id)) {
          const commentRes = await API.delete({ path: `/comment/${comment._id}` });
          if (commentRes.ok) {
            setComments((comments) => comments.filter((p) => p._id !== comment._id));
          }
        }
      }
    }
    for (let comment of comments.filter((c) => c.person === personDB._id)) {
      const commentRes = await API.delete({ path: `/comment/${comment._id}` });
      if (commentRes.ok) {
        setComments((comments) => comments.filter((p) => p._id !== comment._id));
      }
    }
    for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === personDB._id)) {
      const res = await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
      if (res.ok) {
        setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace._id));
      }
    }
    setPersons((persons) => persons.filter((p) => p._id !== personDB._id));
    setDeleting(false);
    Alert.alert('Personne supprimée !');
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
          lazy
          removeClippedSubviews={Platform.OS === 'android'}
          swipeEnabled>
          <TabNavigator.Screen name="Summary" options={{ tabBarLabel: 'Résumé' }}>
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
          <TabNavigator.Screen name="Folders" options={{ tabBarLabel: 'Dossiers' }}>
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
