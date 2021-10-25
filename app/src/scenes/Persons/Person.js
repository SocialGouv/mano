import React from 'react';
import { Alert, Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { compose } from 'recompose';
import PersonSummary from './PersonSummary';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { genders } from '../../components/Selects/GenderSelect';
import FoldersNavigator from './FoldersNavigator';
import Tabs from '../../components/Tabs';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import ActionsContext from '../../contexts/actions';
import PersonsContext from '../../contexts/persons';
import PlacesContext from '../../contexts/places';
import CommentsContext from '../../contexts/comments';
import colors from '../../utils/colors';

const TabNavigator = createMaterialTopTabNavigator();

class Person extends React.Component {
  castToPerson = (person = {}) => {
    return {
      name: person.name || '',
      otherNames: person.otherNames || '',
      birthdate: person.birthdate || null,
      alertness: person.alertness || false,
      wanderingAt: person.wanderingAt || null,
      createdAt: person.createdAt,
      gender: person.gender || genders[0],
      phone: person.phone?.trim() || '',
      description: person.description?.trim() || '',
      personalSituation: person.personalSituation?.trim() || '',
      nationalitySituation: person.nationalitySituation?.trim() || '',
      address: person.address?.trim() || '',
      addressDetail: person.addressDetail?.trim() || '',
      structureSocial: person.structureSocial?.trim() || '',
      employment: person.employment?.trim() || '',
      structureMedical: person.structureMedical?.trim() || '',
      resources: person.resources || [],
      reasons: person.reasons || [],
      healthInsurance: person.healthInsurance?.trim() || '',
      vulnerabilities: person.vulnerabilities || [],
      consumptions: person.consumptions || [],
      assignedTeams: person.assignedTeams || [],
      hasAnimal: person.hasAnimal?.trim() || '',
      entityKey: person.entityKey || '',
      outOfActiveList: person.outOfActiveList || false,
      outOfActiveListReason: person.outOfActiveListReason || '',
    };
  };

  state = {
    person: {},
    // person model
    ...this.castToPerson(this.props.route?.params),
    // otherdata connected to person
    places: null,
    writingComment: '',
    comments: null,
    // component state
    loading: false,
    editable: this.props.route?.params?.editable || false,
    updating: false,
  };
  componentDidMount() {
    this.getData();
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

  onEdit = () => this.setState(({ editable }) => ({ editable: !editable }));

  getData = async () => {
    await this.getPerson();
  };

  setPerson = (personDB) => {
    this.setState({
      person: Object.assign({}, this.castToPerson(personDB), { _id: personDB._id }),
      ...this.castToPerson(personDB),
      loading: false,
    });
  };

  getPerson = async () => {
    const { _id } = this.props.route.params;
    this.setPerson(this.props.context.persons.find((p) => p._id === _id));
  };

  onChange = (newState, forceUpdate = false) => {
    if (forceUpdate) {
      this.setState(newState, () => this.onUpdatePerson(false));
    } else {
      this.setState(newState);
    }
  };

  onUpdatePerson = async (alert = true) => {
    this.setState({ updating: true });
    const { person } = this.state;
    const { updatePerson } = this.props.context;
    const response = await updatePerson(Object.assign({}, this.castToPerson(this.state), { _id: person._id }));
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ updating: false });
      return false;
    }
    if (response.ok) {
      if (alert) Alert.alert('Personne mise à jour !');
      this.setPerson(response.data);
      this.setState({ updating: false, editable: false });
      return true;
    }
  };

  onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer cette personne ?', 'Cette opération est irréversible.', [
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
    const { person } = this.state;
    const response = await this.props.context.deletePerson(person._id);
    if (response.error) {
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      Alert.alert('Personne supprimée !');
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { person } = this.state;
    const newPerson = { ...person, ...this.castToPerson(this.state) };
    if (JSON.stringify(person) !== JSON.stringify(newPerson)) return false;
    return true;
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    Sentry.setContext('person', {});
    route.params?.fromRoute ? navigation.navigate(route.params.fromRoute) : navigation.goBack();
  };

  onGoBackRequested = async () => {
    if (this.state.writingComment.length) {
      const goToNextStep = await new Promise((res) =>
        Alert.alert("Vous êtes en train d'écrire un commentaire, n'oubliez pas de cliquer sur créer !", null, [
          {
            text: "Oui c'est vrai !",
            onPress: () => res(false),
          },
          {
            text: 'Ne pas enregistrer ce commentaire',
            onPress: () => res(true),
            style: 'destructive',
          },
          {
            text: 'Annuler',
            onPress: () => res(false),
            style: 'cancel',
          },
        ])
      );
      if (!goToNextStep) return;
    }
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer les mises-à-jour sur cette personne ?', null, [
      {
        text: 'Enregistrer',
        onPress: this.onUpdatePerson,
      },
      {
        text: 'Ne pas enregistrer',
        style: 'destructive',
        onPress: this.onBack,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  render() {
    const { name, updating, editable, person } = this.state;

    return (
      <SceneContainer backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey}>
        <ScreenTitle
          title={name}
          onBack={this.onGoBackRequested}
          onEdit={!editable ? this.onEdit : null}
          onSave={!editable ? null : this.onUpdatePerson}
          saving={updating}
          backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey}
        />
        <TabNavigator.Navigator
          tabBar={(props) => (
            <Tabs
              numberOfTabs={2}
              {...props}
              backgroundColor={!person?.outOfActiveList ? colors.app.backgroundColor : colors.app.colorBackgroundDarkGrey}
            />
          )}
          lazy
          removeClippedSubviews={Platform.OS === 'android'}
          swipeEnabled>
          <TabNavigator.Screen name="Summary" options={{ tabBarLabel: 'Résumé' }}>
            {() => (
              <PersonSummary
                {...this.state}
                {...this.props}
                backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey}
                onChange={this.onChange}
                onUpdatePerson={this.onUpdatePerson}
                writeComment={(writingComment) => this.setState({ writingComment })}
                onEdit={this.onEdit}
                isUpdateDisabled={this.isUpdateDisabled}
                onDeleteRequest={this.onDeleteRequest}
                onCommentDeleteRequest={this.onCommentDeleteRequest}
              />
            )}
          </TabNavigator.Screen>
          <TabNavigator.Screen name="Folders" options={{ tabBarLabel: 'Dossiers' }}>
            {() => (
              <FoldersNavigator
                {...this.state}
                {...this.props}
                backgroundColor={!person?.outOfActiveList ? colors.app.color : colors.app.colorBackgroundDarkGrey}
                onChange={this.onChange}
                onUpdatePerson={this.onUpdatePerson}
                onEdit={this.onEdit}
                isUpdateDisabled={this.isUpdateDisabled}
                onDeleteRequest={this.onDeleteRequest}
              />
            )}
          </TabNavigator.Screen>
        </TabNavigator.Navigator>
      </SceneContainer>
    );
  }
}

export default compose(
  withContext(ActionsContext),
  withContext(PersonsContext),
  withContext(PlacesContext),
  withContext(CommentsContext),
  withContext(AuthContext)
)(Person);
