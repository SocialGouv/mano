import React from 'react';
import { Alert, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import withContext from '../../contexts/withContext';
import PersonsContext from '../../contexts/persons';

class NewPersonForm extends React.Component {
  state = {
    name: '',
    posting: false,
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

  onCreateUserRequest = async () => {
    const response = await this.onCreateUser();
    const { navigation, route } = this.props;
    if (response.ok) {
      this.backRequestHandled = true; // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
      Sentry.setContext('person', { _id: response.data._id });
      navigation.navigate(route.params.toRoute, {
        fromRoute: route.params.fromRoute,
        _id: response.data._id,
        person: response.data,
        editable: true,
      });
      setTimeout(() => {
        this.setState({ posting: false });
      }, 250);
    }
  };

  onCreateUser = async () => {
    this.setState({ posting: true });
    const { context } = this.props;
    const { name } = this.state;
    const response = await context.addPerson({ name: name.trim() });
    if (!response.ok) {
      this.setState({ posting: false });
      if (response.code === 'USER_ALREADY_EXIST') {
        Alert.alert('Une personne suivie existe déjà avec ce nom', 'Veuillez choisir un autre nom');
      } else {
        Alert.alert(response.error);
      }
      return false;
    }
    return response;
  };

  isReadyToSave = () => {
    const { name } = this.state;
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
    setTimeout(() => {
      this.setState({ posting: false });
    }, 250);
  };

  onGoBackRequested = () => {
    if (!this.isReadyToSave()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer cette personne ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const response = await this.onCreateUser();
          if (response.ok) this.onBack();
        },
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
    const { name, posting } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle title="Ajouter une personne" onBack={this.onGoBackRequested} />
        <ScrollContainer keyboardShouldPersistTaps="handled">
          <View>
            <InputLabelled
              label="Pseudo"
              onChangeText={(name) => this.setState({ name })}
              value={name}
              placeholder="Monsieur X"
              autoCapitalize="words"
            />
            <Button caption="Créer" disabled={!this.isReadyToSave()} onPress={this.onCreateUserRequest} loading={posting} />
          </View>
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default withContext(PersonsContext)(NewPersonForm);
