import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, findNodeHandle, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import styled from 'styled-components';
import { MyText } from '../../components/MyText';
import CustomFieldInput from '../../components/CustomFieldInput';
import { useRecoilState, useRecoilValue } from 'recoil';
import { customFieldsObsSelector, prepareObsForEncryption, territoryObservationsState } from '../../recoil/territoryObservations';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import API from '../../services/api';

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

const TerritoryObservation = ({ route, navigation }) => {
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const [allTerritoryOservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const obsDB = useMemo(() => allTerritoryOservations.find((obs) => obs._id === route.params?._id), [allTerritoryOservations, route.params?._id]);

  const castToTerritoryObservation = useCallback(
    (territoryObservation = {}) => {
      const toReturn = {};
      for (const field of customFieldsObs) {
        toReturn[field.name] = cleanValue(territoryObservation[field.name]);
      }
      return {
        ...toReturn,
        createdAt: territoryObservation.createdAt || null,
        user: territoryObservation.user || {},
        entityKey: territoryObservation.entityKey || '',
      };
    },
    [customFieldsObs]
  );

  const [updating, setUpdating] = useState(false);
  const [editable, setEditable] = useState(route?.params?.editable || false);
  const [obs, setObs] = useState(castToTerritoryObservation(route.params));
  const onChange = (newProps) => setObs((o) => ({ ...o, ...newProps }));

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

  const onSaveObservation = async () => {
    setUpdating(true);
    if (obsDB?._id) return onUpdateTerritoryObservation();
    return onCreateTerritoryObservation();
  };

  const onCreateTerritoryObservation = async () => {
    setUpdating(true);
    const response = await API.post({
      path: '/territory-observation',
      body: prepareObsForEncryption(customFieldsObs)(
        Object.assign({}, castToTerritoryObservation(obs), {
          territory: route.params.territory._id,
          user: user._id,
          team: currentTeam._id,
          organisation: organisation._id,
        })
      ),
    });
    if (response.code || response.error) {
      setUpdating(false);
      Alert.alert(response.error || response.code);
      return false;
    }
    if (response.ok) {
      Alert.alert('Nouvelle observation créée !');
      setObs(castToTerritoryObservation(response.decryptedData));
      setTerritoryObservations((territoryObservations) => [response.decryptedData, ...territoryObservations]);
      setUpdating(false);
      setEditable(false);
      return onBack();
    }
  };

  const onUpdateTerritoryObservation = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/territory-observation/${obsDB._id}`,
      body: prepareObsForEncryption(customFieldsObs)(
        Object.assign({}, castToTerritoryObservation(obs), {
          _id: obsDB._id,
          territory: route.params.territory._id,
          user: user._id,
          team: currentTeam._id,
          organisation: organisation._id,
        })
      ),
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setObs(castToTerritoryObservation(response.decryptedData));
      setTerritoryObservations((territoryObservations) =>
        territoryObservations.map((a) => {
          if (a._id === obsDB._id) return response.decryptedData;
          return a;
        })
      );
      Alert.alert('Observation mise-à-jour !');
      setUpdating(false);
      setEditable(false);
      return true;
    }
  };

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce territoire ?', 'Cette opération est irréversible.', [
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
    const response = await API.delete({ path: `/territory-observation/${obsDB._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== obsDB._id));
      Alert.alert('Observation supprimée !');
      onBack();
    }
  };

  const isUpdateDisabled = useMemo(() => {
    const newTerritoryObservation = {
      ...obsDB,
      ...castToTerritoryObservation(obs),
    };
    if (JSON.stringify(castToTerritoryObservation(obsDB)) !== JSON.stringify(castToTerritoryObservation(newTerritoryObservation))) {
      return false;
    }
    return true;
  }, [castToTerritoryObservation, obs, obsDB]);

  const onGoBackRequested = () => {
    if (isUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer cette observation ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await onSaveObservation();
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
  const scrollViewRef = useRef(null);
  const refs = useRef({});
  const _scrollToInput = (ref) => {
    if (!ref) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.measureLayout(
        findNodeHandle(scrollViewRef.current),
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  return (
    <SceneContainer>
      <ScreenTitle
        title={`${route?.params?.territory?.name} - Observation`}
        onBack={onGoBackRequested}
        onEdit={!editable ? onEdit : null}
        onSave={!editable || isUpdateDisabled ? null : onSaveObservation}
        saving={updating}
      />
      <ScrollContainer ref={scrollViewRef}>
        <View>
          <CreatedAt>{new Date(obs?.createdAt || Date.now()).getLocaleDateAndTime('fr')}</CreatedAt>
          {customFieldsObs
            .filter((f) => f.enabled)
            .map((field) => {
              const { label, name } = field;
              return (
                <CustomFieldInput
                  key={label}
                  label={label}
                  field={field}
                  value={obs[name]}
                  handleChange={(newValue) => onChange({ [name]: newValue })}
                  editable={editable}
                  ref={(r) => (refs.current[`${name}-ref`] = r)}
                  onFocus={() => _scrollToInput(refs.current[`${name}-ref`])}
                />
              );
            })}

          <ButtonsContainer>
            {obsDB?._id ? (
              <>
                <ButtonDelete onPress={onDeleteRequest} />
                <Button
                  caption={editable ? 'Mettre à jour' : 'Modifier'}
                  onPress={editable ? onSaveObservation : onEdit}
                  disabled={editable ? isUpdateDisabled : false}
                  loading={updating}
                />
              </>
            ) : (
              <Button caption="Enregistrer" onPress={onSaveObservation} disabled={isUpdateDisabled} loading={updating} />
            )}
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

const CreatedAt = styled(MyText)`
  font-style: italic;
  margin-top: -10px;
  margin-bottom: 20px;
  margin-left: auto;
`;

export default TerritoryObservation;
