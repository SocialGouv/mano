/* eslint-disable react/no-did-mount-set-state */
import React from 'react';
import { Alert, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import InputFromSearchList from '../../components/InputFromSearchList';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import ActionsContext, { TODO } from '../../contexts/actions';
import PersonsContext from '../../contexts/persons';
import ActionStatusSelect from '../../components/Selects/ActionStatusSelect';

class NewActionForm extends React.Component {
  state = {
    name: '',
    dueAt: null,
    withTime: false,
    persons: [null],
    forCurrentPerson: false,
    posting: false,
    status: TODO,
  };

  async componentDidMount() {
    const { route } = this.props;
    if (route.params?.person) {
      this.setState({
        persons: [route.params.person],
        forCurrentPerson: true,
      });
    }
    this.props.navigation.addListener('focus', this.handleFocus);
    this.props.navigation.addListener('beforeRemove', this.handleBeforeRemove);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this.handleFocus);
    this.props.navigation.removeListener('beforeRemove', this.handleBeforeRemove);
  }

  handleBeforeRemove = (e) => {
    if (this.backRequestHandled) return;
    e.preventDefault();
    this.onGoBackRequested();
  };

  handleFocus = () => {
    const newPerson = this.props?.route?.params?.person;
    if (newPerson) {
      this.setState({ persons: [...this.state.persons.filter((p) => p._id !== newPerson?._id), newPerson] });
    }
  };

  onSearchPerson = () => {
    this.props.navigation.push('Persons', {
      screen: 'PersonsSearch',
      params: { fromRoute: 'NewActionForm' },
    });
  };

  onCreateAction = async () => {
    const { name, person, dueAt, withTime, status } = this.state;
    const { addAction, currentTeam } = this.props.context;
    this.setState({ posting: true });
    const response = await addAction({
      name,
      person,
      team: currentTeam._id,
      dueAt,
      withTime,
      status,
      completedAt: status !== TODO ? new Date().toISOString() : null,
    });
    if (!response.ok) {
      this.setState({ posting: false });
      Alert.alert(response.error || response.code);
      return;
    }
    if (response.ok) {
      const { navigation, route } = this.props;
      this.backRequestHandled = true; // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
      Sentry.setContext('action', { _id: response.data._id });
      navigation.navigate('Action', {
        fromRoute: route.params.fromRoute,
        ...response.data,
        editable: true,
      });
      if (!response.ok) {
        this.setState({ posting: false });
        Alert.alert(response.error || response.code);
        return;
      }
      if (!newAction) newAction = response.data;
    }
    const { navigation, route } = this.props;
    // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
    this.backRequestHandled = true;
    Sentry.setContext('action', { _id: newAction._id });
    navigation.navigate('Action', {
      fromRoute: route.params.fromRoute,
      ...newAction,
      editable: true,
    });
    setTimeout(() => {
      this.setState({ posting: false });
    }, 250);
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
  };

  canGoBack = () => {
    const { name, persons, dueAt, forCurrentPerson } = this.state;
    if (!name.length && (forCurrentPerson || !persons.length) && !dueAt) return true;
    return false;
  };

  isReadyToSave = () => {
    const { name, dueAt } = this.state;
    if (!name || !name.length || !name.trim().length) return false;
    if (!persons.length) return false;
    if (!dueAt) return false;
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
    const { name, person, dueAt, withTime, forCurrentPerson, posting, status } = this.state;
    const { persons } = this.props.context;
    return (
      <SceneContainer>
        <ScreenTitle title="Nouvelle action" onBack={this.onGoBackRequested} />
        <ScrollContainer keyboardShouldPersistTaps="handled">
          <View>
            <InputLabelled label="Nom de l’action" onChangeText={(name) => this.setState({ name })} value={name} placeholder="Rdv chez le dentiste" />
            <InputFromSearchList
              label="Personne concernée"
              value={persons.find((p) => p._id === person)?.name || '-- Aucune --'}
              onSearchRequest={this.onSearchPerson}
              disabled={forCurrentPerson}
            />
            <ActionStatusSelect onSelect={(status) => this.setState({ status })} value={status} editable />
            <DateAndTimeInput
              label="Échéance"
              setDate={(dueAt) => this.setState({ dueAt })}
              date={dueAt}
              showTime
              showDay
              withTime={withTime}
              setWithTime={(withTime) => this.setState({ withTime })}
            />
            <Button caption="Créer" disabled={!this.isReadyToSave()} onPress={this.onCreateAction} loading={posting} />
          </View>
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default compose(withContext(AuthContext), withContext(ActionsContext), withContext(PersonsContext))(NewActionForm);
