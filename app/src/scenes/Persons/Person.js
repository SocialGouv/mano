import React from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import Button from '../../components/Button';
import API from '../../api';
import { Alert } from 'react-native';
import InputLabelled from '../../components/InputLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import ActionRow from '../Actions/ActionRow';
import CommentRow from '../Comments/CommentRow';
import SubList from '../../components/SubList';
import colors from '../../utils/colors';
import Spinner from '../../components/Spinner';
import ButtonDelete from '../../components/ButtonDelete';
import SelectLabelled from '../../components/SelectLabelled';
import DateAndTimeInput from '../../components/DatePicker';
import needRefresh from '../../utils/needRefresh';
import GenderSelect, { genders } from './GenderSelect';

class Person extends React.Component {
  state = {
    person: {},
    name: this.props.route?.params?.name || '',
    birthdate: undefined,
    description: '',
    places: [],
    actions: [],
    comments: [],
    gender: genders[0].name,
    loading: true,
  };

  componentDidMount() {
    this.getData();
    const { navigation } = this.props;
    if (needRefresh.Person) delete needRefresh.Person;
    navigation.addListener('focus', this.handleFocus);
  }

  getData = async () => {
    await this.getPerson();
    await this.getPersonComments();
    await this.getPersonPlaces();
    await this.getPersonActions();
  };

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this.handleFocus);
  }

  handleFocus = () => {
    if (needRefresh.Person) {
      delete needRefresh.Person;
      this.getData();
    }
  };

  setPerson = (personDB) => {
    const { name, birthdate, description, gender, _id } = personDB;
    const person = {
      name: name || '',
      birthdate: birthdate || '',
      gender: gender ? genders.find((g) => g.name === gender)?.name : genders[0].name,
      description: description || '',
    };
    this.setState({
      person: Object.assign({}, person, { _id }),
      ...person,
      loading: false,
    });
  };

  getPerson = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: `/person/${_id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) this.setPerson(response.data);
  };

  getPersonComments = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: '/comment', query: { personId: _id } });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) this.setState({ comments: response.data });
  };

  getPersonPlaces = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: '/place', query: { personId: _id } });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) this.setState({ places: response.data });
  };

  getPersonActions = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: '/action', query: { personId: _id } });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) this.setState({ actions: response.data });
  };

  onUpdatePerson = async () => {
    this.setState({ updating: true });
    const { person, name, birthdate, gender, description } = this.state;
    const response = await API.put({
      path: `/person/${person._id}`,
      body: {
        name,
        birthdate,
        gender,
        description: description.trim(),
      },
    });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ updating: false });
      return false;
    }
    if (response.ok) {
      Alert.alert('Usager mis-à-jour !');
      this.setPerson(response.data);
      this.setNeedRefresh();
      this.setState({ updating: false });
      return true;
    }
  };

  onDeleteRequest = () => {
    Alert.alert(
      'Voulez-vous vraiment supprimer cet usager ?',
      'Cette opération est irréversible.',
      [
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: this.onDelete,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  onDelete = async () => {
    const { person } = this.state;
    const response = await API.delete({ path: `/person/${person._id}` });
    if (response.error) {
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      Alert.alert('Usager supprimé !');
      this.setNeedRefresh();
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { person, name, birthdate, gender, description } = this.state;
    if (person.name !== name) return false;
    if (person.gender !== gender) return false;
    if (person.birthdate !== birthdate) return false;
    if (person.description !== description) return false;
    return true;
  };

  setNeedRefresh = () => {
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    needRefresh.PersonsSearch = true;
  };

  onBack = () => {
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
  };

  onBackRequest = async () => {
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer les mises-à-jour sur cet usager ?', null, [
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

  onAddCommentRequest = () => {
    const { person } = this.state;
    const { navigation } = this.props;
    navigation.navigate('NewPersonCommentForm', { person, fromRoute: 'Person' });
  };
  onAddPlaceRequest = () => {
    const { person } = this.state;
    const { navigation } = this.props;
    navigation.navigate('NewPersonPlaceForm', { person, fromRoute: 'Person' });
  };
  onAddActionRequest = () => {
    const { person } = this.state;
    const { navigation } = this.props;
    navigation.navigate('NewActionForm', { person, fromRoute: 'Person' });
  };

  render() {
    const {
      name,
      birthdate,
      description,
      actions,
      loading,
      comments,
      places,
      gender,
      updating,
    } = this.state;
    const { navigation } = this.props;

    return (
      <SceneContainer>
        <ScreenTitle
          title={name}
          onBack={this.onBackRequest}
          backgroundColor={colors.person.backgroundColor}
          color={colors.person.color}
        />
        {loading ? (
          <Spinner />
        ) : (
          <ScrollContainer>
            <InputLabelled
              label="Pseudo"
              onChangeText={(newName) => this.setState({ name: newName })}
              value={name}
              placeholder="Monsieur X"
            />
            <GenderSelect onSelect={(gender) => this.setState({ gender })} value={gender} />
            <DateAndTimeInput
              label="Date de naissance"
              setDate={(newDate) => this.setState({ birthdate: newDate })}
              date={birthdate}
            />
            <InputLabelled
              label="Description"
              onChangeText={(description) => this.setState({ description })}
              value={description}
              placeholder="Description"
              multiline
            />
            <ButtonsContainer>
              <ButtonDelete onPress={this.onDeleteRequest} />
              <Button
                caption="Mettre-à-jour"
                backgroundColor={colors.person.backgroundColor}
                color={colors.person.color}
                onPress={this.onUpdatePerson}
                disabled={this.isUpdateDisabled()}
                loading={updating}
              />
            </ButtonsContainer>
            <SubList
              label="Commentaires"
              onAdd={this.onAddCommentRequest}
              data={comments}
              renderItem={(comment, index) => (
                <CommentRow
                  key={index}
                  comment={comment.comment}
                  userName={comment.user.name}
                  createdAt={comment.createdAt}
                  onPress={() =>
                    navigation.navigate('PersonComment', {
                      _id: comment._id,
                      name,
                      fromRoute: 'Person',
                    })
                  }
                />
              )}
              ifEmpty="Pas encore de commentaire"
            />
            <SubList
              label="Lieux fréquentés"
              onAdd={this.onAddPlaceRequest}
              data={places}
              renderItem={(place, index) => (
                <CommentRow
                  key={index}
                  comment={place.name}
                  createdAt={place.createdAt}
                  userName={place.user.name}
                  onPress={() =>
                    navigation.navigate('PersonPlace', {
                      _id: place._id,
                      name,
                      fromRoute: 'Person',
                    })
                  }
                />
              )}
              ifEmpty="Pas encore de lieu"
            />
            <SubList
              label="Actions"
              onAdd={this.onAddActionRequest}
              data={actions}
              renderItem={(action, index) => (
                <ActionRow
                  key={index}
                  pseudo={action.person.name}
                  name={action.name}
                  completedAt={action}
                  dueAt={action.dueAt}
                  status={action.status}
                  onActionPress={() =>
                    navigation.navigate('Action', { _id: action._id, fromRoute: 'Person' })
                  }
                />
              )}
              ifEmpty="Pas encore d'action"
            />
          </ScrollContainer>
        )}
      </SceneContainer>
    );
  }
}

export default Person;
