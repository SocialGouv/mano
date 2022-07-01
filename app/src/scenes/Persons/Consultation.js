import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
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
import { consultationsState, encryptedFields, prepareConsultationForEncryption } from '../../recoil/consultations';
import ConsultationTypeSelect from '../../components/Selects/ConsultationTypeSelect';
import CustomFieldInput from '../../components/CustomFieldInput';
import { organisationState, userState } from '../../recoil/auth';
import { CANCEL, DONE, TODO } from '../../recoil/actions';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

const Consultation = ({ navigation, route }) => {
  const setAllConsultations = useSetRecoilState(consultationsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const personDB = route?.params?.personDB;
  const consultationDB = route?.params?.consultationDB;
  const isNew = !consultationDB?._id;

  const castToConsultation = useCallback(
    (consult = {}) => {
      const toReturn = {};
      const consultationTypeCustomFields = consult?.type
        ? organisation.consultations.find((c) => c?.name === consult?.type)?.fields
        : organisation.consultations[0].fields;
      const encryptedFieldsIncludingCustom = [...consultationTypeCustomFields.map((f) => f.name), ...encryptedFields];
      for (const field of encryptedFieldsIncludingCustom) {
        toReturn[field] = cleanValue(consult[field]);
      }
      return {
        ...toReturn,
        name: consult.name || '',
        type: consult.type || '',
        status: consult.status || TODO,
        dueAt: consult.dueAt || null,
        person: consult.person || personDB._id,
        completedAt: consult.completedAt || null,
        onlyVisibleBy: consult.onlyVisibleBy || [],
        user: consult.user || user._id,
        organisation: consult.organisation || organisation._id,
      };
    },
    [organisation._id, organisation.consultations, personDB._id, user._id]
  );

  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [consultation, setConsultation] = useState(() => castToConsultation(consultationDB));

  const onChange = (keyValue) => setConsultation((c) => ({ ...c, ...keyValue }));

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

  const onSaveConsultationRequest = async () => {
    if (!consultation.name) return Alert.alert('Veuillez indiquer un nom');
    if (!consultation.status) return Alert.alert('Veuillez indiquer un status');
    if (!consultation.dueAt) return Alert.alert('Veuillez indiquer un dueAt');
    if (!consultation.type) return Alert.alert('Veuillez indiquer un type');
    Keyboard.dismiss();
    setPosting(true);
    if ([DONE, CANCEL].includes(consultation.status)) {
      if (!consultation.completedAt) consultation.completedAt = new Date();
    } else {
      consultation.completedAt = null;
    }
    const body = prepareConsultationForEncryption(organisation.consultations)({ ...consultation, _id: consultationDB?._id });
    const consultationResponse = isNew
      ? await API.post({ path: '/consultation', body })
      : await API.put({ path: `/consultation/${consultationDB._id}`, body });
    if (!consultationResponse.ok) return;
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
    onBack();
  };

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

  const onGoBackRequested = () => {
    if (isDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer cette consultation ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const response = await onSaveConsultationRequest();
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
    <SceneContainer testID="consultation-form">
      <ScreenTitle
        title={`${isNew ? 'Nouvelle consultation pour' : `Modifier la consultation ${consultationDB?.name} de`} ${personDB?.name}`}
        onBack={onGoBackRequested}
        testID="consultation"
      />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <InputLabelled
            label="Nom"
            value={consultation.name}
            onChangeText={(name) => onChange({ name })}
            placeholder="Nom de la consultation"
            testID="consultation-name"
          />
          <ConsultationTypeSelect editable value={consultation.type} onSelect={(type) => onChange({ type })} />
          {organisation.consultations
            .find((e) => e.name === consultation.type)
            ?.fields.filter((f) => f)
            .filter((f) => f.enabled)
            .map((field) => {
              const { label, name } = field;
              return (
                <CustomFieldInput
                  key={label}
                  label={label}
                  field={field}
                  value={consultation[name]}
                  handleChange={(newValue) => onChange({ [name]: newValue })}
                  editable
                // ref={(r) => (refs.current[`${name}-ref`] = r)}
                // onFocus={() => _scrollToInput(refs.current[`${name}-ref`])}
                />
              );
            })}
          <Label label="Document(s)" />
          <DocumentsManager
            personDB={personDB}
            onAddDocument={(doc) => onChange({ documents: [...(consultation.documents || []), doc] })}
            documents={consultation.documents}
          />
          <Spacer />
          <ActionStatusSelect value={consultation.status} onSelect={(status) => onChange({ status })} editable testID="consultation-status" />
          <DateAndTimeInput label="Date" date={consultation.dueAt} setDate={(dueAt) => onChange({ dueAt })} editable showYear />
          <CheckboxLabelled
            label="Seulement visible par moi"
            alone
            onPress={() => onChange({ onlyVisibleBy: consultation.onlyVisibleBy?.includes(user._id) ? [] : [user._id] })}
            value={consultation.onlyVisibleBy?.includes(user._id)}
          />
          <ButtonsContainer>
            {!isNew && <ButtonDelete onPress={onDeleteRequest} deleting={deleting} />}
            <Button
              caption={isNew ? 'Créer' : 'Modifier'}
              disabled={!!isDisabled}
              onPress={onSaveConsultationRequest}
              loading={posting}
              testID="consultation-create"
            />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Consultation;
