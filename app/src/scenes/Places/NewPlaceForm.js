import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import API from '../../services/api';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import Search from '../../components/Search';
import { FlashListStyled } from '../../components/Lists';
import { ListEmptyPlaceWithName } from '../../components/ListEmptyContainer';
import Row from '../../components/Row';
import Spacer from '../../components/Spacer';
import { placesState, preparePlaceForEncryption } from '../../recoil/places';
import { prepareRelPersonPlaceForEncryption, relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { userState } from '../../recoil/auth';
import { refreshTriggerState } from '../../components/Loader';
import { sortByName } from '../../utils/sortByName';

const NewPlaceForm = ({ route, navigation }) => {
  const [name, setName] = useState('');
  const [posting, setPosting] = useState(false);

  const [places, setPlaces] = useRecoilState(placesState);
  const setRelsPersonPlace = useSetRecoilState(relsPersonPlaceState);
  const user = useRecoilValue(userState);
  const data = useMemo(() => {
    if (!name) return places;
    return places.filter((p) => p.name.toLocaleLowerCase().includes(name.toLocaleLowerCase()));
  }, [name, places]);

  const { person } = route.params;

  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);

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

  const onCreatePlace = async () => {
    setPosting(true);
    const response = await API.post({ path: '/place', body: preparePlaceForEncryption({ name }) });
    if (response.error) {
      setPosting(false);
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      setPlaces((places) => [response.decryptedData, ...places].sort(sortByName));

      onSubmit(response.decryptedData);
    }
  };

  const onSubmit = async (place) => {
    setPosting(true);

    const response = await API.post({
      path: '/relPersonPlace',
      body: prepareRelPersonPlaceForEncryption({ place: place._id, person: person._id, user: user._id }),
    });
    if (response.error) {
      setPosting(false);
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      setRelsPersonPlace((relsPersonPlace) => [response.decryptedData, ...relsPersonPlace]);
      setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
      onBack();
    }
  };

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.navigate(route.params.fromRoute);
    setTimeout(() => setPosting(false), 250);
  };

  const isReadyToSave = () => {
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  };

  const onGoBackRequested = () => {
    if (!isReadyToSave) return onBack();

    if (isReadyToSave) {
      Alert.alert('Voulez-vous enregistrer ce lieu ?', null, [
        {
          text: 'Enregistrer',
          onPress: onCreatePlace,
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
      return;
    }
    Alert.alert('Voulez-vous abandonner la création de ce lieu ?', null, [
      {
        text: 'Continuer la création',
      },
      {
        text: 'Abandonner',
        onPress: onBack,
        style: 'destructive',
      },
    ]);
  };
  const keyExtractor = (structure) => structure._id;
  const renderRow = ({ item: place }) => <Row onPress={() => onSubmit(place)} caption={place.name} />;

  return (
    <SceneContainer>
      <ScreenTitle title={`Nouveau lieu - ${person.name}`} onBack={onGoBackRequested} />
      <Search results={data} placeholder="Rechercher un lieu..." onChange={setName} />
      <FlashListStyled
        data={data}
        estimatedItemSize={77}
        ListHeaderComponent={() => (
          <>
            <Button caption="Créer" disabled={!isReadyToSave} onPress={onCreatePlace} loading={posting} />
            <Spacer height={15} />
          </>
        )}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        ListEmptyComponent={name.length ? ListEmptyPlaceWithName(name) : null}
      />
    </SceneContainer>
  );
};

export default NewPlaceForm;
