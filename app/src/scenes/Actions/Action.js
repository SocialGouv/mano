import React from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../api';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import colors from '../../utils/colors';
import ButtonDelete from '../../components/ButtonDelete';
import InputFromSearchList from '../../components/InputFromSearchList';
import DateAndTimeInput from '../../components/DatePicker';
import SubList from '../../components/SubList';
import CommentRow from '../Comments/CommentRow';
import needRefresh from '../../utils/needRefresh';
import ActionStatusSelect from './ActionStatusSelect';
import StructureSelect, { initStructure } from '../Structures/StructureSelect';

const initPerson = {
  _id: '0',
  name: '-- Choissisez un pseudo --',
};

class Action extends React.Component {
  state = {
    action: {},
    name: this.props.route?.params?.name || '',
    dueAt: '',
    withTime: false,
    description: '',
    status: 'A FAIRE',
    person: initPerson,
    structure: initStructure,
    user: null,
    completedAt: null,
    comments: [],
    loading: true,
    updating: false,
  };

  componentDidMount() {
    this.getData();
    this.props.navigation.addListener('focus', this.handleFocus);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this.handleFocus);
  }

  handleFocus = () => {
    const { route } = this.props;
    if (route.params?.person) this.setState({ person: route.params.person });
    if (needRefresh.Action) {
      delete needRefresh.Action;
      this.getData();
    }
  };

  getData = async () => {
    await this.getAction();
    await this.getActionComments();
  };

  onSearchPerson = () => {
    this.props.navigation.navigate('PersonsSearch', { fromRoute: 'Action' });
  };

  setAction = (actionDB) => {
    try {
      if (!actionDB) {
        console.log('no action');
        this.onBack();
        return;
      }
      const {
        name,
        status,
        description,
        person,
        structure,
        user,
        dueAt,
        withTime,
        completedAt,
        _id,
      } = actionDB;
      const action = {
        name: name || '',
        description: description || '',
        person: person || initPerson,
        structure: structure || initStructure,
        user: user || null,
        status: status || 'A FAIRE',
        dueAt: dueAt || '',
        withTime: withTime || false,
        completedAt: completedAt || null,
      };
      this.setState({
        action: Object.assign({}, action, { _id }),
        ...action,
        loading: false,
      });
    } catch (e) {
      console.log('error setting action', e);
      console.log(actionDB);
    }
  };

  getActionComments = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: '/comment', query: { actionId: _id } });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) this.setState({ comments: response.data });
  };

  getAction = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: `/action/${_id}` });
    if (response.error) return Alert.alert(response.error);
    this.setAction(response.data);
  };

  onUpdateAction = async () => {
    this.setState({ updating: true });
    const { name, dueAt, withTime, description, person, structure, action, status } = this.state;
    if (!dueAt) {
      Alert.alert("Vous devez rentrer une date d'échéance");
      this.setState({ updating: false });
      return false;
    }
    const response = await API.put({
      path: `/action/${action._id}`,
      body: {
        name,
        dueAt: dueAt || null,
        withTime,
        description: description.trim(),
        person: person._id.length > 1 ? person : {},
        structure: structure._id.length > 1 ? structure : {},
        status,
        completedAt:
          action.status !== 'FAIT' && status === 'FAIT' ? new Date().toISOString() : null,
      },
    });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ updating: false });
      return false;
    }
    if (response.ok) {
      this.setNeedRefresh();
      this.setState({ updating: false });
      Alert.alert('Action mise-à-jour !', null, [{ text: 'OK', onPress: this.onBack }]);
      return true;
    }
  };

  onDeleteRequest = () => {
    Alert.alert(
      'Voulez-vous vraiment supprimer cette action ?',
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
    const { action } = this.state;
    const response = await API.delete({ path: `/action/${action._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Action supprimée !');
      this.setNeedRefresh();
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { name, dueAt, withTime, person, structure, action, description, status } = this.state;
    if (action.name !== name) return false;
    if (action.status !== status) return false;
    if (action.person.name !== person.name) {
      if (!(action.person._id.length === 1 && person._id.length === 1)) return false;
    }
    if (action.structure.name !== structure.name) {
      if (!(action.structure._id.length === 1 && structure._id.length === 1)) return false;
    }
    if (action.dueAt !== dueAt) return false;
    if (action.withTime !== withTime) return false;
    if (action.description !== description) return false;
    return true;
  };

  setNeedRefresh = () => {
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    needRefresh.Person = true;
  };

  onBack = () => {
    const { navigation, route } = this.props;
    const { routes } = navigation.dangerouslyGetState();
    // FIXME there is no perfect solution yet to handle the navigation
    // fromRoute parameter is good but sometimes not so good...
    navigation.navigate(
      route.params.fromRoute === 'NewActionForm'
        ? routes[routes.length - 3].name // example [{ name: AcionsList },{ name: NewActionForm },{ name: Action }]
        : route.params.fromRoute
    );
    this.setState({ updating: false });
  };

  onGoBackRequested = () => {
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer cette action ?', null, [
      {
        text: 'Enregistrer',
        onPress: this.onUpdateAction,
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

  onAddCommentRequest = () => {
    const { action } = this.state;
    const { navigation } = this.props;
    navigation.navigate('NewActionCommentForm', { action, fromRoute: 'Action' });
  };

  render() {
    const {
      loading,
      name,
      dueAt,
      withTime,
      description,
      person,
      structure,
      user,
      status,
      comments,
      updating,
    } = this.state;
    const { navigation } = this.props;
    return (
      <SceneContainer>
        <ScreenTitle
          title={person._id.length > 1 ? `${name} - ${person.name}` : name}
          onBack={this.onGoBackRequested}
          backgroundColor={colors.action.backgroundColor}
          color={colors.action.color}
        />
        <ScrollContainer>
          {loading ? (
            <Spinner />
          ) : (
            <>
              {!!user && <FromUser>Action créée par {user.name}</FromUser>}
              <InputLabelled
                label="Nom de l’action"
                onChangeText={(newName) => this.setState({ name: newName })}
                value={name}
                placeholder="Nom de l’action"
              />
              <InputFromSearchList
                label="Personne concernée"
                value={person.name}
                onSearchRequest={this.onSearchPerson}
              />
              <ActionStatusSelect onSelect={(status) => this.setState({ status })} value={status} />
              <DateAndTimeInput
                label="Échéance"
                setDate={(newDueDate) => this.setState({ dueAt: newDueDate })}
                date={dueAt}
                showTime
                withTime={withTime}
                setWithTime={(newWithTime) => this.setState({ withTime: newWithTime })}
              />
              <StructureSelect
                onSelect={(structure) => this.setState({ structure })}
                value={structure}
              />
              <InputLabelled
                label="Description"
                onChangeText={(newDescription) => this.setState({ description: newDescription })}
                value={description}
                placeholder="Description"
                multiline
              />
              <ButtonsContainer>
                <ButtonDelete onPress={this.onDeleteRequest} />
                <Button
                  caption="Mettre-à-jour"
                  backgroundColor={colors.action.backgroundColor}
                  color={colors.action.color}
                  onPress={this.onUpdateAction}
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
                    createdAt={comment.createdAt}
                    userName={comment.user.name}
                    onPress={() =>
                      navigation.navigate('ActionComment', {
                        _id: comment._id,
                        name,
                        fromRoute: 'Action',
                      })
                    }
                  />
                )}
                ifEmpty="Pas encore de commentaire"
              />
            </>
          )}
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

const FromUser = styled.Text`
  font-style: italic;
  margin-top: -10px;
  margin-bottom: 20px;
  margin-left: auto;
`;

export default Action;
