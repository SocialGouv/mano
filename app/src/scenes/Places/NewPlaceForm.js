import React from 'react';
import { Alert, View } from 'react-native';
import SceneContainer from '../../components/SceneContainer';
import ContentContainer from '../../components/ContentContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import API from '../../api';
import colors from '../../utils/colors';
import needRefresh from '../../utils/needRefresh';
import AutoComplete from '../../components/AutoComplete';

class NewPlaceForm extends React.Component {
  state = {
    name: '',
    posting: false,
    place: '',
  };

  onCreatePlace = async () => {
    this.setState({ posting: true });
    const { name } = this.state;
    const { person } = this.props.route.params;
    const body = { name, person: person._id };
    const response = await API.post({ path: '/place', body });
    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      this.setNeedRefresh();
      this.onBack();
    }
  };

  onSubmit = async () => {
    this.setState({ posting: true });
    const { place, name } = this.state;
    const { person } = this.props.route.params;

    let response = null;
    if (place) {
      response = await API.post({
        path: '/place/addUser',
        body: { place, person: person._id },
      });
    } else {
      response = await API.post({
        path: '/place',
        body: { name, person: person._id },
      });
    }

    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      this.setNeedRefresh();
      this.onBack();
    }
  };

  setNeedRefresh = () => {
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    needRefresh.Person = true;
  };

  onBack = () => {
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

  render() {
    const { name, posting } = this.state;
    const { person } = this.props.route.params;
    return (
      <SceneContainer>
        <ScreenTitle
          title={`Nouveau lieu - ${person.name}`}
          onBack={this.onGoBackRequested}
          backgroundColor={colors.person.backgroundColor}
          color={colors.person.color}
        />
        <ContentContainer>
          <AutoComplete
            label={'Nom de Lieu'}
            url={'/place/autoComplete'}
            value={name}
            onSelect={({ id, name }) => this.setState({ name, place: id })}
            onChange={(name) => this.setState({ name, place: '' })}
            onClear={() => this.setState({ name: '', place: '' })}
            maxHeight={300}
            hideSuggestion={false}
          />

          <Button
            caption="Créer"
            disabled={!this.isReadyToSave()}
            onPress={this.onSubmit}
            backgroundColor={colors.person.backgroundColor}
            color={colors.person.color}
            loading={posting}
          />
        </ContentContainer>
      </SceneContainer>
    );
  }
}

export default NewPlaceForm;
