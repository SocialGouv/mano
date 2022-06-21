import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Alert, Linking } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import { getCityFromPostCode } from '../../services/postCode';
import ButtonsContainer from '../../components/ButtonsContainer';
import colors from '../../utils/colors';
import ButtonDelete from '../../components/ButtonDelete';
import Label from '../../components/Label';
import Tags from '../../components/Tags';
import Spacer from '../../components/Spacer';
import PinIcon from '../../icons/PinIcon';
import PhoneIcon from '../../icons/PhoneIcon';
import { MyText } from '../../components/MyText';
import { useRecoilState } from 'recoil';
import { structuresState } from '../../recoil/structures';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';

const isEven = (value) => {
  if (value % 2 === 0) return true;
  return false;
};

const castToStructure = (structure = {}) => ({
  name: structure.name?.trim() || '',
  adresse: structure.adresse?.trim() || '',
  postcode: structure.postcode?.trim() || '',
  city: structure.city?.trim() || '',
  description: structure.description?.trim() || '',
  phone: structure.phone?.trim() || '',
  categories: structure.categories?.length ? structure.categories : [],
});

const Structure = ({ navigation, route }) => {
  const [structures, setStructures] = useRecoilState(structuresState);
  const structureDB = useMemo(() => structures.find((s) => s._id === route.params?._id), [route.params?._id, structures]);

  const [structure, setStructure] = useState(() => castToStructure(route?.params));
  const [updating, setUpdating] = useState(false);
  const [editable, setEditable] = useState(route.params?.editable || false);
  const [cagetoriesUpdated, setCagetoriesUpdated] = useState(false);

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
  const onEdit = () => setEditable((e) => !e);

  const setPostCode = async (postcode) => {
    setStructure((s) => ({ ...s, postcode }));
    if (postcode.length === 5) {
      const response = await getCityFromPostCode(postcode);
      if (response.ok) {
        setStructure((s) => ({ ...s, city: response.city }));
      }
    }
  };

  const setPhone = (phone) => {
    if (!phone.startsWith('0')) return setStructure((s) => ({ ...s, phone }));
    const phoneNumber = structure.phone;
    if (phone.length < phoneNumber.length) {
      if (phoneNumber.endsWith(' ')) {
        setStructure((s) => ({ ...s, phone: phone.slice(0, -1) }));
      } else {
        setStructure((s) => ({ ...s, phone }));
      }
      return;
    }
    const noSpacePhone = phone.split(' ').join('');

    if (noSpacePhone.length >= 10) return setStructure((s) => ({ ...s, phone }));
    if (isEven(noSpacePhone.length)) {
      setStructure((s) => ({ ...s, phone: `${phone} ` }));
    } else {
      setStructure((s) => ({ ...s, phone }));
    }
  };

  const onCall = () => Linking.openURL('tel:' + structure.phone.split(' ').join(''));

  const onUpdateStructure = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/structure/${structureDB._id}`,
      body: castToStructure(structure),
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      Alert.alert('Structure mise à jour !');
      setStructures((structures) =>
        structures.map((s) => {
          if (s._id === response.data._id) return response.data;
          return s;
        })
      );
      setUpdating(false);
      setEditable(false);
      return true;
    }
  };

  const onDelete = async () => {
    setUpdating(true);
    const response = await API.delete({ path: `/structure/${structureDB._id}` });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
    }
    if (!response.ok) return false;
    Alert.alert('Structure supprimée !');
    setStructures((structures) => structures.filter((s) => s._id !== structure._id));
    setUpdating(false);
    return true;
  };

  const isUpdateDisabled = useMemo(() => {
    const newStructure = { ...structureDB, ...castToStructure(structure) };
    if (cagetoriesUpdated) return false;
    if (JSON.stringify(castToStructure(structureDB)) !== JSON.stringify(castToStructure(newStructure))) return false;
    return true;
  }, [cagetoriesUpdated, structure, structureDB]);

  const formatGoogleMapUrl = useMemo(() => {
    const { adresse, city, postcode } = structure;
    const query = `${adresse.trim()} ${postcode ? postcode.trim() + ' ' : ' '}${city.trim()}`.split(' ').join('+');
    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${query}`;
  }, [structure]);
  const onShowMap = () => Linking.openURL(formatGoogleMapUrl);

  const showMapButton = useMemo(() => {
    const { adresse, city } = structure;
    if (!adresse) return false;
    if (!city) return false;
    return Linking.canOpenURL(formatGoogleMapUrl);
  }, [structure, formatGoogleMapUrl]);

  const onGoBackRequested = () => {
    if (isUpdateDisabled) return onBack();
    Alert.alert('Voulez-vous enregistrer cette structure ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await onUpdateStructure();
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

  const { name, description, categories, city, postcode, adresse, phone } = structure;

  return (
    <SceneContainer>
      <ScreenTitle
        title={name}
        onBack={onGoBackRequested}
        onEdit={!editable ? onEdit : null}
        onSave={!editable || isUpdateDisabled ? null : onUpdateStructure}
        saving={updating}
      />
      <ScrollContainer>
        <InputLabelled
          label="Nom"
          onChangeText={(name) => setStructure((s) => ({ ...s, name }))}
          value={name}
          placeholder="Nom"
          textContentType="organizationName"
          editable={editable}
        />
        <InputLabelled
          label="Adresse"
          onChangeText={(adresse) => setStructure((s) => ({ ...s, adresse }))}
          value={adresse}
          placeholder="Bâtiment B\n2, rue de la République"
          multiline
          autoCorrect={false}
          textContentType="fullStreetAddress"
          editable={editable}
        />
        <InputLabelled
          label="Code postal"
          onChangeText={setPostCode}
          value={postcode}
          placeholder="75018"
          textContentType="postalCode"
          keyboardType="numeric"
          maxLength={5}
          editable={editable}
        />
        <InputLabelled
          label="Ville"
          onChangeText={(city) => setStructure((s) => ({ ...s, city }))}
          value={city}
          placeholder="Paris"
          autoCapitalize="characters"
          textContentType="addressCity"
          autoCorrect={false}
          editable={editable}
        />
        {!editable && !!showMapButton && <Spacer />}
        {!!showMapButton && (
          <ButtonsContainer>
            <Button caption="Afficher dans Google Maps" Icon={PinIcon} color={colors.app.secondary} onPress={onShowMap} fullWidth />
          </ButtonsContainer>
        )}
        {!editable && !!showMapButton && <Spacer />}
        <Row>
          <InputLabelled
            label="Téléphone"
            onChangeText={setPhone}
            value={phone}
            placeholder="06 12 52 32 13"
            textContentType="telephoneNumber"
            keyboardType="number-pad"
            autoCorrect={false}
            editable={editable}
            noMargin={editable || phone?.length}
          />
          <Spacer />
          {!!phone.length && <Button caption="Appeler" Icon={PhoneIcon} color={colors.app.secondary} onPress={onCall} noBorder />}
        </Row>
        <InputLabelled
          label="Description"
          value={description}
          onChangeText={(description) => setStructure((s) => ({ ...s, description }))}
          placeholder="Description"
          multiline
          editable={editable}
        />
        <Label label="Catégories" big={!editable} />
        <Tags
          data={categories}
          onChange={(categories) => {
            setStructure((s) => ({ ...s, categories }));
            setCagetoriesUpdated(true);
          }}
          editable={editable}
          renderTag={(name) => <MyText>{name}</MyText>}
        />
        <ButtonsContainer>
          <DeleteButtonAndConfirmModal
            title={`Voulez-vous vraiment supprimer ${structureDB?.name} ?`}
            onBack={onBack}
            textToConfirm={structureDB?.name}
            onDelete={onDelete}>
            Cette opération est irréversible{'\n'}et entrainera la suppression définitive de cette structure{'\n'}pour toutes les organisations qui
            utilisent Mano
          </DeleteButtonAndConfirmModal>
          <Button
            caption={editable ? 'Mettre à jour' : 'Modifier'}
            onPress={editable ? onUpdateStructure : onEdit}
            disabled={editable ? isUpdateDisabled : false}
            loading={updating}
          />
        </ButtonsContainer>
      </ScrollContainer>
    </SceneContainer>
  );
};

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 30px;
`;

export default Structure;
