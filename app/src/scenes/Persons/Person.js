import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRecoilState, useRecoilValue } from 'recoil';
import PersonSummary from './PersonSummary';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import FoldersNavigator from './FoldersNavigator';
import Tabs from '../../components/Tabs';
import colors from '../../utils/colors';
import { useFocusEffect } from '@react-navigation/native';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  allowedFieldsInHistorySelector,
  personsState,
  usePreparePersonForEncryption,
} from '../../recoil/persons';
import { actionsState } from '../../recoil/actions';
import { commentsState } from '../../recoil/comments';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { userState } from '../../recoil/auth';
import API from '../../services/api';
import { rencontresState } from '../../recoil/rencontres';
import { passagesState } from '../../recoil/passages';
import { consultationsState } from '../../recoil/consultations';
import { treatmentsState } from '../../recoil/treatments';
import { medicalFileState } from '../../recoil/medicalFiles';

const TabNavigator = createMaterialTopTabNavigator();

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

const Person = ({ route, navigation }) => {
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const allowedFieldsInHistory = useRecoilValue(allowedFieldsInHistorySelector);
  const preparePersonForEncryption = usePreparePersonForEncryption();

  const [persons, setPersons] = useRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [passages, setPassages] = useRecoilState(passagesState);
  const [rencontres, setRencontres] = useRecoilState(rencontresState);
  const [consultations, setConsultations] = useRecoilState(consultationsState);
  const [treatments, setTreatments] = useRecoilState(treatmentsState);
  const [medicalFiles, setMedicalFiles] = useRecoilState(medicalFileState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const user = useRecoilValue(userState);

  const [personDB, setPersonDB] = useState(() => persons.find((p) => p._id === route.params?.person?._id));

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
        gender: person.gender || '',
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
        healthInsurances: person.healthInsurances || [],
        vulnerabilities: person.vulnerabilities || [],
        consumptions: person.consumptions || [],
        assignedTeams: person.assignedTeams || [],
        hasAnimal: person.hasAnimal?.trim() || '',
        entityKey: person.entityKey || '',
        outOfActiveList: person.outOfActiveList || false,
        outOfActiveListReasons: person.outOfActiveListReasons || [],
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

    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, route?.params?.person]);

  useFocusEffect(
    useCallback(() => {
      setPerson(castToPerson(personDB));
    }, [personDB])
  );

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
    setPersonDB(newPerson);
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
          'Des données médicales sont associées à cette personne. Si vous la supprimez, ces données seront également effacées. Vous n’avez pas accès à ces données médicales car vous n’êtes pas un professionnel de santé. Voulez-vous supprimer cette personne et toutes ses données ?',
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
    const res = await API.delete({ path: `/person/${personId}` });
    if (res.error) {
      if (res.error === 'Not Found') {
        setPersons((persons) => persons.filter((p) => p._id !== personId));
      } else {
        Alert.alert(res.error);
        return false;
      }
    }
    for (const action of actions.filter((a) => a.person === personId)) {
      const actionRes = await API.delete({ path: `/action/${action._id}` });
      if (actionRes.ok) {
        setActions((actions) => actions.filter((a) => a._id !== action._id));
        for (let comment of comments.filter((c) => c.action === action._id)) {
          const commentRes = await API.delete({ path: `/comment/${comment._id}` });
          if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
        }
      }
    }
    for (let comment of comments.filter((c) => c.person === personId)) {
      const commentRes = await API.delete({ path: `/comment/${comment._id}` });
      if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
    }
    for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === personId)) {
      const relRes = await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
      if (relRes.ok) {
        setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace._id));
      }
    }
    for (let passage of passages.filter((c) => c.person === personId)) {
      const passageRes = await API.delete({ path: `/passage/${passage._id}` });
      if (passageRes.ok) setPassages((passages) => passages.filter((c) => c._id !== passage._id));
    }
    for (let rencontre of rencontres.filter((c) => c.person === personId)) {
      const rencontreRes = await API.delete({ path: `/rencontre/${rencontre._id}` });
      if (rencontreRes.ok) setRencontres((rencontres) => rencontres.filter((c) => c._id !== rencontre._id));
    }

    for (let medicalFile of medicalFiles.filter((c) => c.person === personId)) {
      const medicalFileRes = await API.delete({ path: `/medical-file/${medicalFile._id}` });
      if (medicalFileRes.ok) setMedicalFiles((medicalFiles) => medicalFiles.filter((c) => c._id !== medicalFile._id));
    }
    for (let treatment of treatments.filter((c) => c.person === personId)) {
      const treatmentRes = await API.delete({ path: `/treatment/${treatment._id}` });
      if (treatmentRes.ok) setTreatments((treatments) => treatments.filter((c) => c._id !== treatment._id));
    }
    for (let consultation of consultations.filter((c) => c.person === personId)) {
      const consultationRes = await API.delete({ path: `/consultation/${consultation._id}` });
      if (consultationRes.ok) setConsultations((consultations) => consultations.filter((c) => c._id !== consultation._id));
    }
    setPersons((persons) => persons.filter((p) => p._id !== personId));
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
