import React from 'react';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../api';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import needRefresh from '../../utils/needRefresh';

class Place extends React.Component {
  state = {
    placeDB: {},
    comment: '',
    loading: true,
    updating: false,
  };

  async componentDidMount() {
    await this.getPlace();
  }

  setPlace = (placeDB) => {
    const { name, _id } = placeDB;
    const place = {
      name: name || '',
    };
    this.setState({
      placeDB: Object.assign({}, place, { _id }),
      ...place,
      loading: false,
    });
  };

  getPlace = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: `/place/${_id}` });
    if (response.error) return Alert.alert(response.error);
    this.setPlace(response.data);
  };

  onUpdatePlace = async () => {
    this.setState({ updating: true });
    const { name, placeDB } = this.state;
    const response = await API.put({
      path: `/place/${placeDB._id}`,
      body: {
        name: name.trim(),
      },
    });
    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      this.setNeedRefresh();
      this.setState({ updating: false });
      Alert.alert('Lieu mis-à-jour !', null, [{ text: 'OK', onPress: this.onBack }]);
    }
  };

  onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce lieu ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: this.onDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  onDelete = async () => {
    const { placeDB } = this.state;
    const response = await API.delete({ path: `/place/${placeDB._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Lieu supprimé !');
      this.setNeedRefresh();
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { name, placeDB } = this.state;
    if (placeDB.name !== name) return false;
    return true;
  };

  setNeedRefresh = () => {
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    needRefresh.Person = true;
  };

  onBack = () => {
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
  };

  onGoBackRequested = () => {
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer ce lieu ?', null, [
      {
        text: 'Enregistrer',
        onPress: this.onUpdatePlace,
      },
      {
        text: 'Ne pas enregistrer',
        onPress: this.onBack,
        style: 'destructive',
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  render() {
    const { name, loading, updating } = this.state;
    const { params } = this.props.route;
    if (loading) return <Spinner />;
    return (
      <SceneContainer>
        <ScreenTitle title={`${params.name} - Lieu`} onBack={this.onGoBackRequested} />
        <ScrollContainer>
          <InputLabelled
            label="Commentaire"
            onChangeText={(newName) => this.setState({ name: newName })}
            value={name}
            placeholder="Description"
            multiline
          />
          <ButtonsContainer>
            <ButtonDelete onPress={this.onDeleteRequest} />
            <Button
              caption="Mettre-à-jour"
              onPress={this.onUpdatePlace}
              disabled={this.isUpdateDisabled()}
              loading={updating}
            />
          </ButtonsContainer>
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default Place;
