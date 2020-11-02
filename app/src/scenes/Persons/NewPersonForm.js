import React from 'react';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../api';
import colors from '../../utils/colors';
import needRefresh from '../../utils/needRefresh';

const NewPersonForm = ({ navigation, route }) => {
  const [name, setName] = React.useState('');
  const [posting, setPosting] = React.useState('');

  const setNeedRefresh = () => {
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    needRefresh.Person = true;
    needRefresh.PersonsSearch = true;
  };

  const onCreateUserRequest = async () => {
    const response = await onCreateUser();
    if (response.ok) {
      setNeedRefresh();
      navigation.navigate(route.params.toRoute, {
        fromRoute: route.params.fromRoute,
        _id: response.data._id,
        person: response.data,
      });
      setTimeout(() => {
        setPosting(false);
      }, 250);
    }
  };

  const onCreateUser = async () => {
    setPosting(true);
    const response = await API.post({
      path: '/person',
      body: { name: name.trim() },
    });
    if (response.error) {
      setPosting(false);
      Alert.alert(response.error);
      return false;
    }
    return response;
  };

  const isReadyToSave = () => {
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  };

  const onBack = () => {
    navigation.navigate(route.params.fromRoute);
    setTimeout(() => {
      setPosting(false);
    }, 250);
  };

  const onGoBackRequested = () => {
    if (!isReadyToSave()) {
      onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer cet usager ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const response = await onCreateUser();
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

  return (
    <SceneContainer>
      <ScreenTitle
        title="Ajouter un usager"
        onBack={onGoBackRequested}
        backgroundColor={colors.person.backgroundColor}
        color={colors.person.color}
      />
      <ScrollContainer>
        <InputLabelled
          label="Pseudo"
          onChangeText={setName}
          value={name}
          placeholder="Monsieur X"
          autoCapitalize="words"
        />
        <Button
          caption="Créer"
          disabled={!isReadyToSave()}
          onPress={onCreateUserRequest}
          backgroundColor={colors.person.backgroundColor}
          color={colors.person.color}
          loading={posting}
        />
      </ScrollContainer>
    </SceneContainer>
  );
};

export default NewPersonForm;
