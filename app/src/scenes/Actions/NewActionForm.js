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
import Label from '../../components/Label';
import Tags from '../../components/Tags';
import { MyText } from '../../components/MyText';

class NewActionForm extends React.Component {
  state = {
    name: '',
    dueAt: null,
    withTime: false,
    persons: [],
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
    const { route } = this.props;
    const { persons } = this.state;
    const newPerson = route?.params?.person;
    if (newPerson) {
      this.setState({
        persons: [...persons.filter((p) => p !== newPerson), newPerson],
      });
    }
  };

  onSearchPerson = () => {
    this.props.navigation.push('Persons', {
      screen: 'PersonsSearch',
      params: { fromRoute: 'NewActionForm' },
    });
  };

  onCreateAction = async () => {
    const { name, persons, dueAt, withTime, status } = this.state;
    const { context } = this.props;
    this.setState({ posting: true });
    let newAction = null;
    const actions = [];
    for (const person of persons) {
      const response = await context.addAction({
        name,
        person,
        team: context.currentTeam._id,
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
      if (!newAction) newAction = response.data;
      actions.push(response.data);
    }
    const { navigation, route } = this.props;
    // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
    this.backRequestHandled = true;
    Sentry.setContext('action', { _id: newAction._id });
    navigation.navigate('Action', {
      fromRoute: route.params.fromRoute,
      actions,
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
    const { name, dueAt, persons } = this.state;
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
    const { name, persons, dueAt, withTime, forCurrentPerson, posting, status } = this.state;
    const { context } = this.props;
    return (
      <SceneContainer>
        <ScreenTitle title="Nouvelle action" onBack={this.onGoBackRequested} />
        <ScrollContainer keyboardShouldPersistTaps="handled">
          <View>
            <InputLabelled label="Nom de l’action" onChangeText={(name) => this.setState({ name })} value={name} placeholder="Rdv chez le dentiste" />
            {forCurrentPerson ? (
              <InputFromSearchList
                label="Personne concernée"
                value={context.persons.find((p) => p._id === persons[0])?.name || '-- Aucune --'}
                onSearchRequest={this.onSearchPerson}
                disabled
              />
            ) : (
              <>
                <Label label="Personne(s) concerné(es)" />
                <Tags
                  data={persons}
                  onChange={(persons) => this.setState({ persons })}
                  editable
                  onAddRequest={this.onSearchPerson}
                  renderTag={(person) => <MyText>{context.persons.find((p) => p._id === person)?.name}</MyText>}
                />
              </>
            )}
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
