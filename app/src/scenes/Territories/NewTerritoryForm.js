import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSetRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import API from '../../services/api';
import { territoriesState, territoryEncryptedFieldsSelector, usePrepareTerritoryForEncryption } from '../../recoil/territory';
import CustomFieldInput from '../../components/CustomFieldInput';

const NewTerritoryForm = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [posting, setPosting] = useState(false);
  const prepareTerritoryForEncryption = usePrepareTerritoryForEncryption();
  const territoryFields = useRecoilValue(territoryEncryptedFieldsSelector);

  const setTerritories = useSetRecoilState(territoriesState);

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
      navigation.replace('Territory', {
        territory: response.decryptedData,
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
    <SceneContainer testID="new-territory-form">
      <ScreenTitle title="Nouveau territoire" onBack={onGoBackRequested} />
      <ScrollContainer>
        <CustomFieldInput
          label="Nom"
          field={{
            type: 'text',
            name: 'name',
            required: true,
          }}
          value={name}
          handleChange={setName}
          editable
        />
        <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreateTerritory} loading={posting} testID="new-territory-create" />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewTerritoryForm;
