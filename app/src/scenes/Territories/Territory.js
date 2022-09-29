import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import ButtonsContainer from '../../components/ButtonsContainer';
import TerritoryMultiCheckBoxes from '../../components/MultiCheckBoxes/TerritoryMultiCheckBoxes';
import SubList from '../../components/SubList';
import TerritoryObservationRow from './TerritoryObservationRow';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { prepareTerritoryForEncryption, territoriesState } from '../../recoil/territory';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import { onlyFilledObservationsTerritories } from '../../recoil/selectors';

const castToTerritory = (territory = {}) => ({
  name: territory.name?.trim() || '',
  types: territory.types || [],
  perimeter: territory.perimeter?.trim() || '',
  entityKey: territory.entityKey || '',
});

const Territory = ({ route, navigation }) => {
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [territoryDB, setTerritoryDB] = useState(() => territories.find((territory) => territory._id === route.params?.territory?._id));

  const [territory, setTerritory] = useState(castToTerritory(route?.params?.territory));
  const setTerritoryObservations = useSetRecoilState(territoryObservationsState);
  const allTerritoryOservations = useRecoilValue(onlyFilledObservationsTerritories);
  const territoryObservations = useMemo(() => {
    return allTerritoryOservations
      .filter((obs) => obs.territory === territoryDB?._id)
      .sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt));
  }, [territoryDB, allTerritoryOservations]);

  const [updating, setUpdating] = useState(false);
  const [editable, setEditable] = useState(route?.params?.editable || false);

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
      body: prepareTerritoryForEncryption(castToTerritory(territory)),
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
    const newTerritory = { ...territoryDB, ...castToTerritory(territory) };
    if (JSON.stringify(castToTerritory(territoryDB)) !== JSON.stringify(castToTerritory(newTerritory))) return false;
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

  const { name, types, perimeter } = territory;

  return (
    <SceneContainer>
      <ScreenTitle
        title={name}
        onBack={onGoBackRequested}
        onEdit={!editable ? onEdit : null}
        onSave={!editable || isUpdateDisabled ? null : onUpdateTerritory}
        saving={updating}
        testID="territory"
      />
      <ScrollContainer testID="territory">
        <View>
          {!!editable && (
            <InputLabelled
              label="Nom"
              onChangeText={(name) => setTerritory((t) => ({ ...t, name }))}
              value={name}
              placeholder="Nom"
              textContentType="organizationName"
              editable={editable}
            />
          )}
          <TerritoryMultiCheckBoxes values={types} onChange={(types) => setTerritory((t) => ({ ...t, types }))} editable={editable} />
          <InputLabelled
            label="Perimètre"
            onChangeText={(perimeter) => setTerritory((t) => ({ ...t, perimeter }))}
            value={perimeter}
            placeholder="De la rue XXX à la rue XXX"
            editable={editable}
          />
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
