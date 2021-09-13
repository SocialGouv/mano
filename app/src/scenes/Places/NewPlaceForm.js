import React from 'react';
import { Alert } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import API from '../../services/api';
import Search from '../../components/Search';
import FlatListStyled from '../../components/FlatListStyled';
import Spinner from '../../components/Spinner';
import { ListEmptyPlaceWithName } from '../../components/ListEmptyContainer';
import Row from '../../components/Row';
import Spacer from '../../components/Spacer';
import PlacesContext from '../../contexts/places';
import withContext from '../../contexts/withContext';
import { compose } from 'recompose';
import RelsPersonPlaceContext from '../../contexts/relPersonPlace';
import RefreshContext from '../../contexts/refresh';

class NewPlaceForm extends React.Component {
  state = {
    name: '',
    posting: false,
    place: '',
    key: 0,
    loading: false,
  };
  componentDidMount() {
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

  onCreatePlace = async () => {
    this.setState({ posting: true });
    const { name } = this.state;
    const body = { name };
    const response = await this.props.context.addPlace(body);
    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      this.setState({ place: response.data }, this.onSubmit);
    }
  };

  onSubmit = async () => {
    this.setState({ posting: true });
    const { place } = this.state;
    const { route, context } = this.props;
    const { person } = route.params;

    const response = await context.addRelation({ place: place._id, person: person._id });
    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      context.refreshPlacesAndRelations();
      this.onBack();
    }
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
    setTimeout(() => {
      this.setState({ posting: false });
    }, 250);
  };

  isReadyToSave = () => {
    const { name } = this.state;
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  };

  onGoBackRequested = () => {
    if (!this.isReadyToSave()) {
      this.onBack();
      return;
    }

    if (this.isReadyToSave()) {
      Alert.alert('Voulez-vous enregistrer ce lieu ?', null, [
        {
          text: 'Enregistrer',
          onPress: this.onCreatePlace,
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
      return;
    }
    Alert.alert('Voulez-vous abandonner la création de ce lieu ?', null, [
      {
        text: 'Continuer la création',
      },
      {
        text: 'Abandonner',
        onPress: this.onBack,
        style: 'destructive',
      },
    ]);
  };
  keyExtractor = (structure) => structure._id;
  selectPlace = (place) => {
    this.setState({ place }, this.onSubmit);
  };
  renderRow = ({ item: place }) => {
    const { name } = place;
    return <Row onPress={() => this.selectPlace(place)} caption={name} />;
  };

  render() {
    const { name, loading, key, posting } = this.state;
    const { person } = this.props.route.params;
    const { places } = this.props.context;
    const data = places.filter((p) => p.name.toLocaleLowerCase().includes(name.toLocaleLowerCase()));
    return (
      <SceneContainer>
        <ScreenTitle title={`Nouveau lieu - ${person.name}`} onBack={this.onGoBackRequested} />
        <Search results={data} placeholder="Rechercher un lieu..." onChange={(name) => this.setState({ name })} />
        <FlatListStyled
          data={data}
          ListHeaderComponent={() => (
            <>
              <Button caption="Créer" disabled={!this.isReadyToSave()} onPress={this.onCreatePlace} loading={posting} />
              <Spacer height={15} />
            </>
          )}
          extraData={key}
          renderItem={this.renderRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : name.length ? ListEmptyPlaceWithName(name) : null}
        />
      </SceneContainer>
    );
  }
}

export default compose(withContext(RelsPersonPlaceContext), withContext(PlacesContext), withContext(RefreshContext))(NewPlaceForm);
