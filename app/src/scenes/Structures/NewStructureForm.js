import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSetRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import { structuresState } from '../../recoil/structures';
import { sortByName } from '../../utils/sortByName';

const NewStructureForm = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [posting, setPosting] = useState(false);

  const setStructures = useSetRecoilState(structuresState);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.goBack();
  };

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

  const onCreateStructure = async () => {
    setPosting(true);
    const response = await API.post({
      path: '/structure',
      body: { name },
    });
    if (response.error) {
      setPosting(false);
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      backRequestHandledRef.current = true; // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
      setStructures((structures) => [...structures, response.data].sort(sortByName));
      navigation.replace('Structure', {
        structure: response.data,
        editable: true,
      });
      setTimeout(() => setPosting(false), 250);
    }
  };

  const isReadyToSave = useMemo(() => {
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  }, [name]);

  const onGoBackRequested = () => {
    if (!isReadyToSave) return onBack();
    Alert.alert('Voulez-vous enregistrer cette structure ?', null, [
      {
        text: 'Enregistrer',
        onPress: onCreateStructure,
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
      <ScreenTitle title="Nouvelle structure" onBack={onGoBackRequested} />
      <ScrollContainer>
        <InputLabelled label="Nom" onChangeText={setName} value={name} placeholder="Hôpital du Centre" />
        <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateStructure} loading={posting} />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewStructureForm;
