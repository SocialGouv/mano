import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { useSetRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import { prepareTreatmentForEncryption, treatmentsState } from '../../recoil/treatments';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import DocumentsManager from '../../components/DocumentsManager';
import Spacer from '../../components/Spacer';
import Label from '../../components/Label';
import ButtonDelete from '../../components/ButtonDelete';
import ButtonsContainer from '../../components/ButtonsContainer';

const Treatment = ({ navigation, route }) => {
  const setAllTreatments = useSetRecoilState(treatmentsState);
  const personDB = route?.params?.personDB;
  const treatmentDB = route?.params?.treatmentDB;
  const isNew = !treatmentDB?._id;

  const [name, setName] = useState(treatmentDB?.name || '');
  const [dosage, setDosage] = useState(treatmentDB?.dosage || '');
  const [frequency, setFrequency] = useState(treatmentDB?.frequency || '');
  const [indication, setIndication] = useState(treatmentDB?.indication || '');
  const [startDate, setStartDate] = useState(treatmentDB?.startDate || null);
  const [endDate, setEndDate] = useState(treatmentDB?.endDate || null);
  const [documents, setDocuments] = useState(treatmentDB?.documents || []);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const onSaveTreatment = async () => {
    if (!name) return Alert.alert('Veuillez indiquer un nom');
    if (!dosage) return Alert.alert('Veuillez indiquer un dosage');
    if (!frequency) return Alert.alert('Veuillez indiquer une fréquence');
    if (!indication) return Alert.alert('Veuillez indiquer une indication');
    if (!startDate) return Alert.alert('Veuillez indiquer une date de début');
    Keyboard.dismiss();
    setPosting(true);
    const body = prepareTreatmentForEncryption({
      name,
      dosage,
      frequency,
      indication,
      startDate,
      endDate,
      person: personDB._id,
      documents,
    });
    const treatmentResponse = isNew ? await API.post({ path: '/treatment', body }) : await API.put({ path: `/treatment/${treatmentDB._id}`, body });
    if (!treatmentResponse.ok) return;
    if (isNew) {
      setAllTreatments((all) => [...all, treatmentResponse.decryptedData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
    } else {
      setAllTreatments((all) =>
        all
          .map((c) => {
            if (c._id === treatmentDB._id) return treatmentResponse.decryptedData;
            return c;
          })
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      );
    }
    onBack();
  };

  const isDisabled = useMemo(() => {
    if (!name || !name.length || !name.trim().length) return true;
    if (JSON.stringify((treatmentDB || {}).documents) !== JSON.stringify(documents)) return false;
    if (JSON.stringify((treatmentDB || {}).name) !== JSON.stringify(name)) return false;
    if (JSON.stringify((treatmentDB || {}).dosage) !== JSON.stringify(dosage)) return false;
    if (JSON.stringify((treatmentDB || {}).frequency) !== JSON.stringify(frequency)) return false;
    if (JSON.stringify((treatmentDB || {}).indication) !== JSON.stringify(indication)) return false;
    if (JSON.stringify((treatmentDB || {}).startDate) !== JSON.stringify(startDate)) return false;
    if (JSON.stringify((treatmentDB || {}).endDate) !== JSON.stringify(endDate)) return false;
    return true;
  }, [documents, dosage, endDate, frequency, indication, name, startDate, treatmentDB]);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
    setTimeout(() => setPosting(false), 250);
  };

  const onGoBackRequested = () => {
    if (isDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer ce traitement ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const response = await onSaveTreatment();
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

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce traitement ?', 'Cette opération est irréversible.', [
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
    const response = await API.delete({ path: `/treatment/${treatmentDB._id}` });
    if (!response.ok) {
      Alert.alert(response.error);
      return;
    }
    setAllTreatments((all) => all.filter((t) => t._id !== treatmentDB._id));
    Alert.alert('Traitement supprimé !');
    onBack();
  };

  return (
    <SceneContainer testID="new-treatment-form">
      <ScreenTitle
        title={`${isNew ? 'Ajouter un traitement pour' : `Modifier le traitement ${treatmentDB?.name} de`} ${personDB?.name}`}
        onBack={onGoBackRequested}
        testID="new-treatment"
      />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <InputLabelled label="Nom" value={name} onChangeText={setName} placeholder="Amoxicilline" testID="new-treatment-name" />
          <InputLabelled label="Dosage" value={dosage} onChangeText={setDosage} placeholder="1mg" testID="new-treatment-dosage" />
          <InputLabelled
            label="Fréquence"
            value={frequency}
            onChangeText={setFrequency}
            placeholder="1 fois par jour"
            testID="new-treatment-frequency"
          />
          <InputLabelled label="Indication" value={indication} onChangeText={setIndication} placeholder="Angine" testID="new-treatment-indication" />
          <Label label="Document(s)" />
          <DocumentsManager personDB={personDB} onAddDocument={(doc) => setDocuments((docs) => [...docs, doc])} documents={documents} />
          <Spacer />
          <DateAndTimeInput label="Date de début" date={startDate} setDate={setStartDate} editable showYear />
          <DateAndTimeInput label="Date de fin" date={endDate} setDate={setEndDate} editable showYear />
          <ButtonsContainer>
            {!isNew && <ButtonDelete onPress={onDeleteRequest} deleting={deleting} />}
            <Button
              caption={isNew ? 'Créer' : 'Modifier'}
              disabled={!!isDisabled}
              onPress={onSaveTreatment}
              loading={posting}
              testID="new-treatment-create"
            />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Treatment;
