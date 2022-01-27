import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRecoilState } from 'recoil';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import { placesState, preparePlaceForEncryption } from '../../recoil/places';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import API from '../../services/api';

const Place = ({ navigation, route }) => {
  const [name, setName] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [places, setPlaces] = useRecoilState(placesState);
  const placeDB = useMemo(() => places.find((p) => p._id === route.params._id), [places, route?.params?._id]);

  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);

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

  const onUpdatePlace = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/place/${placeDB._id}`,
      body: preparePlaceForEncryption({
        name: name.trim(),
        _id: placeDB._id,
        entityKey: placeDB.entityKey,
      }),
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setPlaces((places) =>
        places
          .map((p) => {
            if (p._id === placeDB._id) return response.decryptedData;
            return p;
          })
          .sort((p1, p2) => p1.name.localeCompare(p2.name))
      );
      setUpdating(false);
      Alert.alert('Lieu mis-à-jour !', null, [{ text: 'OK', onPress: onBack }]);
    }
  };

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce lieu ?', 'Cette opération est irréversible.', [
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
    setUpdating(true);
    const response = await API.delete({ path: `/place/${placeDB._id}` });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      setPlaces((places) => places.filter((p) => p._id !== placeDB._id));
      for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.place === placeDB._id)) {
        await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
      }
      setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel.place !== placeDB._id));
      setUpdating(false);
      Alert.alert('Lieu supprimé !');
      onBack();
    }
  };

  const isUpdateDisabled = useMemo(() => placeDB.name === name, [name, placeDB.name]);

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.navigate(route.params.fromRoute);
  };

  const onGoBackRequested = () => {
    if (isUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer ce lieu ?', null, [
      {
        text: 'Enregistrer',
        onPress: onUpdatePlace,
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
      <ScreenTitle title={`${route.params.personName} - Lieu`} onBack={onGoBackRequested} />
      <ScrollContainer>
        <View>
          <InputLabelled label="Nom du lieu" onChangeText={setName} value={name} placeholder="Description" multiline />
          <ButtonsContainer>
            <ButtonDelete onPress={onDeleteRequest} />
            <Button caption="Mettre-à-jour" onPress={onUpdatePlace} disabled={isUpdateDisabled} loading={updating} />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Place;
