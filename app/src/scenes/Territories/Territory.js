import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import API from '../../services/api';
import ButtonsContainer from '../../components/ButtonsContainer';
import SubList from '../../components/SubList';
import TerritoryObservationRow from './TerritoryObservationRow';
import { useRecoilState, useRecoilValue } from 'recoil';
import { territoriesState, territoryEncryptedFieldsSelector, usePrepareTerritoryForEncryption } from '../../recoil/territory';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import CustomFieldInput from '../../components/CustomFieldInput';

const Territory = ({ route, navigation }) => {
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [territoryDB, setTerritoryDB] = useState(() => territories.find((territory) => territory._id === route.params?.territory?._id));

  const [territory, setTerritory] = useState(route?.params?.territory);
  const [allTerritoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const territoryObservations = useMemo(() => {
    return allTerritoryObservations
      .filter((obs) => obs.territory === territoryDB?._id)
      .sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt));
  }, [territoryDB, allTerritoryObservations]);

  const [updating, setUpdating] = useState(false);
  const [editable, setEditable] = useState(route?.params?.editable || false);
  const prepareTerritoryForEncryption = usePrepareTerritoryForEncryption();
  const territoryFields = useRecoilValue(territoryEncryptedFieldsSelector);

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

  const onEdit = () => setEditable((e) => !e);

  const onUpdateTerritory = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/territory/${territoryDB._id}`,
      body: prepareTerritoryForEncryption(territory),
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setTerritories((territories) =>
        territories.map((a) => {
          if (a._id === territoryDB._id) return response.decryptedData;
          return a;
        })
      );
      setTerritoryDB(response.decryptedData);
      Alert.alert('Territoire mis à jour !');
      setUpdating(false);
      setEditable(false);
      return true;
    }
  };

  const onDelete = async () => {
    const response = await API.delete({ path: `/territory/${territoryDB._id}` });
    if (response.error) {
      Alert.alert(response.error);
      return false;
    }
    if (!response.ok) return false;
    for (let obs of territoryObservations.filter((o) => o.territory === territoryDB._id)) {
      await API.delete({ path: `/territory-observation/${obs._id}` });
      setTerritoryObservations((obs) => obs.filter((o) => o.territory !== territoryDB._id));
    }
    setTerritories((territories) => territories.filter((t) => t._id !== territoryDB._id));
    Alert.alert('Territoire supprimé !');
    return true;
  };

  const isUpdateDisabled = useMemo(() => {
    const newTerritory = { ...territoryDB, ...territory };
    for (const field of territoryFields) {
      if (JSON.stringify(newTerritory[field.name]) !== JSON.stringify(territoryDB[field.name])) return false;
    }
    return true;
  }, [territoryDB, territory]);

  const onNewObservation = () => navigation.navigate('TerritoryObservation', { territory: territoryDB, editable: true });

  const onUpdateObservation = (obs) => {
    navigation.navigate('TerritoryObservation', { obs, territory: territoryDB, editable: true });
  };

  const onGoBackRequested = () => {
    if (isUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer ce territoire ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await onUpdateTerritory();
          if (ok) onBack();
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
    <SceneContainer>
      <ScreenTitle
        title={territory.name}
        onBack={onGoBackRequested}
        onEdit={!editable ? onEdit : null}
        onSave={!editable || isUpdateDisabled ? null : onUpdateTerritory}
        saving={updating}
        testID="territory"
      />
      <ScrollContainer testID="territory">
        <View>
          {!!editable && (
            <CustomFieldInput
              label="Nom"
              field={{
                type: 'text',
                name: 'name',
                required: true,
              }}
              value={territory.name}
              handleChange={(name) => setTerritory((t) => ({ ...t, name }))}
              editable
            />
          )}
          {territoryFields
            .filter((f) => !['name', 'user'].includes(f.name))
            .map((field) => (
              <CustomFieldInput
                key={field.name}
                label={field.label}
                field={field}
                value={territory[field.name]}
                handleChange={(newValue) => setTerritory((t) => ({ ...t, [field.name]: newValue }))}
                editable={editable}
              />
            ))}
          <ButtonsContainer>
            <DeleteButtonAndConfirmModal
              title={`Voulez-vous vraiment supprimer ${territoryDB?.name} ?`}
              onBack={onBack}
              textToConfirm={territoryDB?.name}
              onDelete={onDelete}>
              Cette opération est irréversible{'\n'}et entrainera la suppression définitive{'\n'}de toutes les observations liées au territoire
            </DeleteButtonAndConfirmModal>
            <Button
              caption={editable ? 'Mettre à jour' : 'Modifier'}
              onPress={editable ? onUpdateTerritory : onEdit}
              disabled={editable ? isUpdateDisabled : false}
              loading={updating}
            />
          </ButtonsContainer>
          <SubList
            label="Observations"
            testID="observations"
            key={territoryDB?._id}
            data={territoryObservations}
            renderItem={(obs, index) => <TerritoryObservationRow key={index} observation={obs} onUpdate={onUpdateObservation} />}
            ifEmpty="Pas encore d'observation">
            <Button caption="Nouvelle observation" onPress={onNewObservation} testID="observations-add" />
          </SubList>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Territory;
