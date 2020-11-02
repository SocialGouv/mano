/* eslint-disable react/no-did-mount-set-state */
import React from 'react';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../api';
import colors from '../../utils/colors';
import InputFromSearchList from '../../components/InputFromSearchList';
import needRefresh from '../../utils/needRefresh';

const initPerson = {
  name: '-- Choissisez un pseudo --',
  _id: '0',
};

class NewActionForm extends React.Component {
  state = {
    name: '',
    person: initPerson,
    personSearchDisabled: false,
    posting: false,
  };

  async componentDidMount() {
    const { route } = this.props;
    if (route.params?.person) {
      this.setState({ person: route.params.person, personSearchDisabled: true });
    }
    this.props.navigation.addListener('focus', this.handleFocus);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this.handleFocus);
  }

  handleFocus = () => {
    const { route } = this.props;
    if (route.params?.person) {
      this.setState({ person: route.params.person });
    }
  };

  onSearchPerson = () => {
    this.props.navigation.navigate('PersonsSearch', { fromRoute: 'NewActionForm' });
  };

  setNeedRefresh = () => {
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    needRefresh.Person = true;
  };

  onCreateAction = async () => {
    const { name, person } = this.state;
    this.setState({ posting: true });
    const response = await API.post({
      path: '/action',
      body: {
        name,
        person: person._id.length > 1 ? person : {},
      },
    });
    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      const { navigation, route } = this.props;
      this.setNeedRefresh();
      navigation.navigate('Action', {
        fromRoute: route.params.fromRoute,
        _id: response.data._id,
      });
      setTimeout(() => {
        this.setState({ posting: false });
      }, 250);
    }
  };

  onBack = () => {
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
  };

  canGoBack = () => {
    const { name, person, personSearchDisabled } = this.state;
    if (!name.length && (personSearchDisabled || person._id === '0')) return true;
    return false;
  };

  isReadyToSave = () => {
    const { name } = this.state;
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  };

  onGoBackRequested = () => {
    if (this.canGoBack()) {
      this.onBack();
      return;
    }
    if (this.isReadyToSave()) {
      Alert.alert('Voulez-vous enregistrer cette action ?', null, [
        {
          text: 'Enregistrer',
          onPress: this.onCreateAction,
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
    Alert.alert('Voulez-vous abandonner la création de cette action ?', null, [
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
    const { name, person, personSearchDisabled, posting } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle
          title="Nouvelle action"
          onBack={this.onGoBackRequested}
          backgroundColor={colors.action.backgroundColor}
          color={colors.action.color}
        />
        <ScrollContainer>
          <InputLabelled
            label="Nom de l’action"
            onChangeText={(name) => this.setState({ name })}
            value={name}
            placeholder="Rdv chez le dentiste"
          />
          <InputFromSearchList
            label="Personne concernée"
            value={person.name}
            onSearchRequest={this.onSearchPerson}
            disabled={personSearchDisabled}
          />
          <Button
            caption="Créer"
            disabled={!this.isReadyToSave()}
            onPress={this.onCreateAction}
            backgroundColor={colors.action.backgroundColor}
            color={colors.action.color}
            loading={posting}
          />
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default NewActionForm;
