import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSetRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import { prepareTerritoryForEncryption, territoriesState } from '../../recoil/territory';

const NewTerritoryForm = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [posting, setPosting] = useState(false);

  const setTerritories = useSetRecoilState(territoriesState);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.navigate(route.params.fromRoute);
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

  const onCreateTerritory = async () => {
    setPosting(true);
    const response = await API.post({ path: '/territory', body: prepareTerritoryForEncryption({ name }) });
    if (response.error) {
      setPosting(false);
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      backRequestHandledRef.current = true; // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
      setTerritories((territories) => [response.decryptedData, ...territories]);
      navigation.navigate('Territory', {
        fromRoute: route.params.fromRoute,
        ...response.decryptedData,
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
    Alert.alert('Voulez-vous enregistrer ce territoire ?', null, [
      {
        text: 'Enregistrer',
        onPress: onCreateTerritory,
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
      <ScreenTitle title="Nouveau territoire" onBack={onGoBackRequested} />
      <ScrollContainer>
        <InputLabelled label="Nom" onChangeText={setName} value={name} placeholder="Station Stalingrad" />
        <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateTerritory} loading={posting} />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewTerritoryForm;
