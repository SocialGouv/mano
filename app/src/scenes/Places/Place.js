import React from 'react';
import { Alert, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import PlacesContext from '../../contexts/places';
import withContext from '../../contexts/withContext';

class Place extends React.Component {
  state = {
    placeDB: {},
    comment: '',
    loading: true,
    updating: false,
  };
  componentDidMount() {
    this.getPlace();
    this.props.navigation.addListener('beforeRemove', this.handleBeforeRemove);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('beforeRemove', this.handleBeforeRemove);
  }

  handleBeforeRemove = (e) => {
    if (this.backRequestHandled) return;
    e.preventDefault();
    this.onGoBackRequested();
  };

  setPlace = (placeDB) => {
    const { name, _id, entityKey } = placeDB;
    const place = {
      name: name || '',
      entityKey: entityKey || '',
    };
    this.setState({
      placeDB: Object.assign({}, place, { _id }),
      ...place,
      loading: false,
    });
  };

  getPlace = async () => {
    const { _id } = this.props.route.params;
    this.setPlace(this.props.context.places.find((p) => p._id === _id));
  };

  onUpdatePlace = async () => {
    this.setState({ updating: true });
    const { name, placeDB } = this.state;
    const response = await this.props.context.updatePlace({
      name: name.trim(),
      _id: placeDB._id,
      entityKey: placeDB.entityKey,
    });
    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
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
    const response = await this.props.context.deletePlace(placeDB._id);
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Lieu supprimé !');
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { name, placeDB } = this.state;
    if (placeDB.name !== name) return false;
    return true;
  };

  onBack = () => {
    this.backRequestHandled = true;
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
        <ScreenTitle title={`${params.personName} - Lieu`} onBack={this.onGoBackRequested} />
        <ScrollContainer>
          <View>
            <InputLabelled
              label="Nom du lieu"
              onChangeText={(newName) => this.setState({ name: newName })}
              value={name}
              placeholder="Description"
              multiline
            />
            <ButtonsContainer>
              <ButtonDelete onPress={this.onDeleteRequest} />
              <Button caption="Mettre-à-jour" onPress={this.onUpdatePlace} disabled={this.isUpdateDisabled()} loading={updating} />
            </ButtonsContainer>
          </View>
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default withContext(PlacesContext)(Place);
