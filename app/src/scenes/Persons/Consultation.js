import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { useFocusEffect } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import DocumentsManager from '../../components/DocumentsManager';
import Spacer from '../../components/Spacer';
import Label from '../../components/Label';
import ActionStatusSelect from '../../components/Selects/ActionStatusSelect';
import {
  consultationsFieldsIncludingCustomFieldsSelector,
  consultationsState,
  encryptedFields,
  prepareConsultationForEncryption,
} from '../../recoil/consultations';
import ConsultationTypeSelect from '../../components/Selects/ConsultationTypeSelect';
import CustomFieldInput from '../../components/CustomFieldInput';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { CANCEL, DONE, TODO } from '../../recoil/actions';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import InputFromSearchList from '../../components/InputFromSearchList';
import CommentRow from '../Comments/CommentRow';
import SubList from '../../components/SubList';
import NewCommentInput from '../Comments/NewCommentInput';
import { refreshTriggerState } from '../../components/Loader';

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

const Consultation = ({ navigation, route }) => {
  const [allConsultations, setAllConsultations] = useRecoilState(consultationsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const person = route?.params?.personDB || route?.params?.person;
  const consultationsFieldsIncludingCustomFields = useRecoilValue(consultationsFieldsIncludingCustomFieldsSelector);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);

  const consultationDB = useMemo(() => {
    if (route?.params?.consultationDB?._id) {
      return allConsultations.find((c) => c._id === route?.params?.consultationDB?._id);
    } else {
      return {
        user: user._id,
      };
    }
  }, [allConsultations, route?.params?.consultationDB?._id, user._id]);

  const isNew = !consultationDB?._id;
  const [writingComment, setWritingComment] = useState('');

  const castToConsultation = useCallback(
    (consult = {}) => {
      const toReturn = {};
      const consultationTypeCustomFields = consult?.type
        ? organisation.consultations.find((c) => c?.name === consult?.type)?.fields
        : organisation.consultations[0].fields;
      const encryptedFieldsIncludingCustom = [...(consultationTypeCustomFields?.map((f) => f.name) || []), ...encryptedFields];
      for (const field of encryptedFieldsIncludingCustom) {
        toReturn[field] = cleanValue(consult[field]);
      }
      return {
        ...toReturn,
        name: consult.name || '',
        type: consult.type || '',
        status: consult.status || TODO,
        dueAt: consult.dueAt || null,
        person: consult.person || person?._id,
        completedAt: consult.completedAt || null,
        onlyVisibleBy: consult.onlyVisibleBy || [],
        user: consult.user || user._id,
        teams: consult.teams || [],
        history: consult.history || [],
        organisation: consult.organisation || organisation._id,
      };
    },
    [organisation?._id, organisation.consultations, person?._id, user?._id]
  );

  const [posting, setPosting] = useState(false);
  const [editable, setEditable] = useState(!!isNew);
  const [deleting, setDeleting] = useState(false);

  const [consultation, setConsultation] = useState(() => castToConsultation(consultationDB));

  useEffect(() => {
    setConsultation(castToConsultation(consultationDB));
  }, [consultationDB?.updatedAt]);

  const onChange = (keyValue) => setConsultation((c) => ({ ...c, ...keyValue }));

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
        setConsultation((c) => ({ ...c, person: newPerson?._id }));
      }
    }, [route?.params?.person])
  );
  useEffect(() => {
    if (!editable) {
      if (consultation.status !== consultationDB.status) onSaveConsultationRequest();
      if (JSON.stringify(consultation.onlyVisibleBy) !== JSON.stringify(consultationDB.onlyVisibleBy)) {
        onSaveConsultationRequest({ goBackOnSave: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, consultation.status, consultation.onlyVisibleBy]);

  useEffect(() => {
    if (route?.params?.duplicate) {
      Alert.alert(
        'La consultation est dupliquée, vous pouvez la modifier !',
        'Les commentaires de la consultation aussi sont dupliqués. La consultation originale est annulée.'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDuplicate = async () => {
    const response = await API.post({
      path: '/consultation',
      body: prepareConsultationForEncryption(organisation.consultations)({
        ...consultation,
        _id: undefined,
        status: TODO,
        user: user._id,
        teams: [currentTeam._id],
      }),
    });
    if (!response.ok) {
      Alert.alert('Impossible de dupliquer !');
      return;
    }
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
    backRequestHandledRef.current = true;
    //  navigation.push('PersonsSearch', { fromRoute: 'Consultation' })
    navigation.replace('Consultation', {
      personDB: person,
      consultationDB: response.decryptedData,
      fromRoute: 'MedicalFile',
      editable: true,
      duplicate: true,
    });
  };

  const onSaveConsultationRequest = useCallback(
    async ({ goBackOnSave = true, consultationToSave = null } = {}) => {
      if (!consultationToSave) consultationToSave = consultation;
      if (!consultationToSave.status) return Alert.alert('Veuillez indiquer un statut');
      if (!consultationToSave.dueAt) return Alert.alert('Veuillez indiquer une date');
      if (!consultationToSave.type) return Alert.alert('Veuillez indiquer un type');
      if (!consultationToSave.person) return Alert.alert('Veuillez ajouter une personne');
      Keyboard.dismiss();
      setPosting(true);
      if ([DONE, CANCEL].includes(consultationToSave.status)) {
        if (!consultationToSave.completedAt) consultationToSave.completedAt = new Date();
      } else {
        consultationToSave.completedAt = null;
      }

      if (!isNew) {
        const historyEntry = {
          date: new Date(),
          user: user._id,
          data: {},
        };
        for (const key in consultationToSave) {
          if (!consultationsFieldsIncludingCustomFields.map((field) => field.name).includes(key)) continue;
          if (consultationToSave[key] !== consultationDB[key]) {
            historyEntry.data[key] = { oldValue: consultationDB[key], newValue: consultationToSave[key] };
          }
        }
        if (!!Object.keys(historyEntry.data).length) consultationToSave.history = [...(consultationDB.history || []), historyEntry];
      }

      const body = prepareConsultationForEncryption(organisation.consultations)({
        ...consultationToSave,
        teams: isNew ? [currentTeam._id] : consultationToSave.teams,
        _id: consultationDB?._id,
      });

      const consultationResponse = isNew
        ? await API.post({ path: '/consultation', body })
        : await API.put({ path: `/consultation/${consultationDB._id}`, body });
      if (!consultationResponse.ok) return false;
      if (isNew) {
        setAllConsultations((all) => [...all, consultationResponse.decryptedData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
      } else {
        setAllConsultations((all) =>
          all
            .map((c) => {
              if (c._id === consultationDB._id) return consultationResponse.decryptedData;
              return c;
            })
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        );
      }
      const consultationCancelled = consultationToSave.status === CANCEL && consultationDB.status !== CANCEL;
      if (!isNew && consultationCancelled) {
        Alert.alert('Cette consultation est annulée, voulez-vous la dupliquer ?', 'Avec une date ultérieure par exemple', [
          { text: 'Oui', onPress: onDuplicate },
          {
            text: 'Non merci !',
            onPress: () => {
              if (goBackOnSave) {
                onBack();
              } else {
                setPosting(false);
                setConsultation(castToConsultation(consultationResponse.decryptedData));
                return true;
              }
            },
            style: 'cancel',
          },
        ]);
        return;
      }

      if (goBackOnSave) {
        onBack();
      } else {
        setPosting(false);
        setConsultation(castToConsultation(consultationResponse.decryptedData));
        return true;
      }
    },
    [consultation]
  );

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer cette consultation ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onDelete = async () => {
    setDeleting(true);
    const response = await API.delete({ path: `/consultation/${consultationDB._id}` });
    if (!response.ok) {
      Alert.alert(response.error);
      return;
    }
    setAllConsultations((all) => all.filter((t) => t._id !== consultationDB._id));
    Alert.alert('Consultation supprimée !');
    onBack();
  };

  const isDisabled = useMemo(() => {
    if (JSON.stringify(castToConsultation(consultationDB)) === JSON.stringify(castToConsultation(consultation))) return true;
    return false;
  }, [castToConsultation, consultationDB, consultation]);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
    setTimeout(() => setPosting(false), 250);
    setTimeout(() => setDeleting(false), 250);
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
    if (isDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer cette consultation ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          await onSaveConsultationRequest();
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

  const onSearchPerson = () => navigation.push('PersonsSearch', { fromRoute: 'Consultation' });

  const scrollViewRef = useRef(null);
  const newCommentRef = useRef(null);
  const _scrollToInput = (ref) => {
    if (!ref.current) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.current.measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };
  return (
    <SceneContainer testID="consultation-form">
      <ScreenTitle
        title={`${isNew ? `Nouvelle consultation${person?.name ? ' pour' : ''}` : `Modifier la consultation ${consultation?.name} de`} ${
          person?.name || ''
        }`}
        onBack={onGoBackRequested}
        onEdit={!editable ? () => setEditable(true) : null}
        onSave={!editable || isDisabled ? null : () => onSaveConsultationRequest()}
        saving={posting}
        testID="consultation"
      />
      <ScrollContainer ref={scrollViewRef} keyboardShouldPersistTaps="handled">
        <View>
          {!!isNew && !route?.params?.personDB && (
            <InputFromSearchList label="Personne concernée" value={person?.name || '-- Aucune --'} onSearchRequest={onSearchPerson} />
          )}
          <InputLabelled
            label="Nom (facultatif)"
            value={consultation.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="Nom de la consultation (facultatif)"
            testID="consultation-name"
            editable={editable}
          />
          <ConsultationTypeSelect editable={editable} value={consultation.type} onSelect={(type) => onChange({ type })} />
          {organisation.consultations
            .find((e) => e.name === consultation.type)
            ?.fields.filter((f) => f)
            .filter((f) => f.enabled || f.enabledTeams?.includes(currentTeam._id))
            .map((field) => {
              const { label, name } = field;
              return (
                <CustomFieldInput
                  key={label}
                  label={label}
                  field={field}
                  value={consultation[name]}
                  handleChange={(newValue) => onChange({ [name]: newValue })}
                  editable={editable}
                />
              );
            })}
          <Label label="Document(s)" />
          <DocumentsManager
            personDB={person}
            onAddDocument={(doc) => onChange({ documents: [...(consultation.documents || []), doc] })}
            onDelete={(doc) => onChange({ documents: consultation.documents.filter((d) => d.file.filename !== doc.file.filename) })}
            documents={consultation.documents}
          />
          <Spacer />
          <ActionStatusSelect
            value={consultation.status}
            onSelect={(status) => onChange({ status })}
            onSelectAndSave={(status) => onChange({ status })}
            editable={editable}
            testID="consultation-status"
          />
          <DateAndTimeInput
            label="Date"
            date={consultation.dueAt}
            setDate={(dueAt) => onChange({ dueAt })}
            editable={editable}
            showYear
            showTime
            withTime
          />
          {consultationDB?.user === user._id ? (
            <CheckboxLabelled
              label="Seulement visible par moi"
              alone
              onPress={() => {
                onChange({ onlyVisibleBy: consultation.onlyVisibleBy?.includes(user._id) ? [] : [user._id] });
              }}
              value={consultation.onlyVisibleBy?.includes(user._id)}
            />
          ) : null}
          <ButtonsContainer>
            {!isNew && <ButtonDelete onPress={onDeleteRequest} deleting={deleting} />}
            <Button
              caption={isNew ? 'Créer' : editable ? 'Mettre à jour' : 'Modifier'}
              disabled={editable ? isDisabled : false}
              onPress={editable ? () => onSaveConsultationRequest() : () => setEditable(true)}
              loading={posting}
              testID="consultation-create"
            />
          </ButtonsContainer>
          <SubList label="Constantes">
            <React.Fragment key={`${consultationDB?._id}${editable}`}>
              {[
                { name: 'constantes-poids', label: 'Poids (kg)' },
                { name: 'constantes-frequence-cardiaque', label: 'Taille (cm)' },
                { name: 'constantes-taille', label: 'Fréquence cardiaque (bpm)' },
                { name: 'constantes-saturation-o2', label: 'Fréq. respiratoire (mvts/min)' },
                { name: 'constantes-temperature', label: 'Saturation en oxygène (%)' },
                { name: 'constantes-glycemie-capillaire', label: 'Glycémie capillaire (g/L)' },
                { name: 'constantes-frequence-respiratoire', label: 'Température (°C)' },
                { name: 'constantes-tension-arterielle-systolique', label: 'Tension artérielle systolique (mmHg)' },
                { name: 'constantes-tension-arterielle-diastolique', label: 'Tension artérielle diastolique (mmHg)' },
              ].map((constante) => {
                return (
                  <InputLabelled
                    key={constante.name}
                    label={constante.label}
                    value={consultation[constante.name]}
                    onChangeText={(value) => onChange({ [constante.name]: value })}
                    placeholder="50"
                    keyboardType="number-pad"
                    testID={constante.name}
                    editable={editable}
                  />
                );
              })}
            </React.Fragment>
          </SubList>
          <SubList
            label="Commentaires"
            key={consultationDB?._id}
            data={consultation.comments}
            renderItem={(comment) => (
              <CommentRow
                key={comment._id}
                comment={comment}
                onDelete={async () => {
                  const consultationToSave = {
                    ...consultation,
                    comments: consultation.comments.filter((c) => c._id !== comment._id),
                  };
                  setConsultation(consultationToSave); // optimistic UI
                  // need to pass `consultationToSave` if we want last comment to be taken into account
                  // https://react.dev/reference/react/useState#ive-updated-the-state-but-logging-gives-me-the-old-value
                  return onSaveConsultationRequest({ goBackOnSave: false, consultationToSave });
                }}
                onUpdate={async (commentUpdated) => {
                  const consultationToSave = {
                    ...consultation,
                    comments: consultation.comments.map((c) => (c._id === comment._id ? commentUpdated : c)),
                  };
                  setConsultation(consultationToSave); // optimistic UI
                  // need to pass `consultationToSave` if we want last comment to be taken into account
                  // https://react.dev/reference/react/useState#ive-updated-the-state-but-logging-gives-me-the-old-value
                  return onSaveConsultationRequest({ goBackOnSave: false, consultationToSave });
                }}
              />
            )}
            ifEmpty="Pas encore de commentaire">
            <NewCommentInput
              forwardRef={newCommentRef}
              onFocus={() => _scrollToInput(newCommentRef)}
              onCommentWrite={setWritingComment}
              onCreate={(newComment) => {
                const consultationToSave = {
                  ...consultation,
                  comments: [{ ...newComment, type: 'consultation', _id: uuidv4() }, ...(consultation.comments || [])],
                };
                setConsultation(consultationToSave); // optimistic UI
                // need to pass `consultationToSave` if we want last comment to be taken into account
                // https://react.dev/reference/react/useState#ive-updated-the-state-but-logging-gives-me-the-old-value
                onSaveConsultationRequest({ goBackOnSave: false, consultationToSave });
              }}
            />
          </SubList>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Consultation;
