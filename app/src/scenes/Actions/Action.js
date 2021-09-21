import React from 'react';
import { compose } from 'recompose';
import { Alert, findNodeHandle } from 'react-native';
import * as Sentry from '@sentry/react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import InputFromSearchList from '../../components/InputFromSearchList';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import SubList from '../../components/SubList';
import CommentRow from '../Comments/CommentRow';
import ActionStatusSelect from '../../components/Selects/ActionStatusSelect';
import UserName from '../../components/UserName';
import Spacer from '../../components/Spacer';
import NewCommentInput from '../../scenes/Comments/NewCommentInput';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import ActionsContext, { CANCEL, TODO } from '../../contexts/actions';
import CommentsContext from '../../contexts/comments';
import PersonsContext from '../../contexts/persons';
import ActionCategoriesMultiCheckboxes from '../../components/MultiCheckBoxes/ActionCategoriesMultiCheckboxes';
import Label from '../../components/Label';
import Tags from '../../components/Tags';
import { MyText } from '../../components/MyText';

class Action extends React.Component {
  castToAction = (action = {}) => ({
    name: action.name?.trim() || '',
    description: action.description?.trim()?.split('\\n').join('\u000A') || '',
    person: action.person || null,
    categories: action.categories || [],
    user: action.user || null,
    status: action.status || TODO,
    dueAt: action.dueAt || null,
    withTime: action.withTime || false,
    completedAt: action.completedAt || null,
    entityKey: action.entityKey || '',
  });

  state = {
    action: {},
    ...this.castToAction(this.props.route?.params),
    loading: false,
    updating: false,
    writingComment: '',
    editable: this.props.route?.params?.editable || false,
  };

  componentDidMount() {
    this.getData();
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
    if (route.params?.person) {
      this.setState({ person: route.params.person });
    }
  };

  onEdit = () => this.setState({ editable: true });

  getData = async () => {
    await this.getAction();
  };

  onSearchPerson = () => {
    this.props.navigation.push('Persons', {
      screen: 'PersonsSearch',
      params: { fromRoute: 'Action' },
    });
  };

  setAction = (actionDB) => {
    try {
      if (!actionDB) {
        this.onBack();
        return;
      }
      this.setState({
        action: Object.assign({}, this.castToAction(actionDB), { _id: actionDB._id }),
        ...this.castToAction(actionDB),
        loading: false,
      });
    } catch (e) {
      console.log('error setting action', e);
      console.log(actionDB);
    }
  };

  getAction = async () => {
    const { route, context } = this.props;
    const { _id } = route.params;
    this.setAction(context.actions.find((a) => a._id === _id));
  };

  onUpdateAction = async () => {
    this.setState({ updating: true });
    const { dueAt, action, status } = this.state;
    const multipleActions = this.props.route?.params?.actions?.length > 1;
    if (!dueAt) {
      Alert.alert("Vous devez rentrer une date d'échéance");
      this.setState({ updating: false });
      return false;
    }
    let response;
    if (multipleActions) {
      // Update multiple actions.
      for (const a of this.props.route?.params?.actions) {
        response = await this.props.context.updateAction(
          Object.assign(
            {},
            this.castToAction(this.state),
            { completedAt: action.status === TODO && status !== TODO ? new Date().toISOString() : null },
            { _id: a._id, person: a.person }
          )
        );
      }
    } else {
      response = await this.props.context.updateAction(
        Object.assign(
          {},
          this.castToAction(this.state),
          { completedAt: action.status === TODO && status !== TODO ? new Date().toISOString() : null },
          { _id: action._id }
        )
      );
    }

    if (response.error) {
      Alert.alert(response.error);
      this.setState({ updating: false });
      return false;
    }
    if (response.ok) {
      this.setState({ updating: false });
      if (action.status !== CANCEL && status === CANCEL) {
        Alert.alert('Cette action est annulée, voulez-vous la dupliquer ?', 'Avec une date ultérieure par exemple', [
          { text: 'OK', onPress: this.onDuplicate },
          { text: 'Non merci !', onPress: this.onBack, style: 'cancel' },
        ]);
      } else {
        Alert.alert(multipleActions ? 'Actions mises à jour !' : 'Action mise à jour !', null, [{ text: 'OK', onPress: this.onBack }]);
      }
      return true;
    }
  };

  onDuplicate = async () => {
    this.setState({ updating: true });
    const { name, person, dueAt, withTime } = this.state;
    const { context, navigation } = this.props;
    const { addAction, currentTeam } = context;
    const response = await addAction({
      name,
      person,
      team: currentTeam._id,
      dueAt,
      withTime,
      status: TODO,
    });
    Sentry.setContext('action', { _id: response.data._id });
    this.backRequestHandled = true;
    navigation.replace('Action', {
      ...response.data,
      fromRoute: 'ActionsList',
      editable: true,
    });
  };

  onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer cette action ?', 'Cette opération est irréversible.', [
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
    const { action } = this.state;
    const { deleteAction } = this.props.context;
    const multipleActions = this.props.route?.params?.actions?.length > 1;
    let response;
    if (multipleActions) {
      for (const a of this.props.route?.params?.actions) {
        response = await deleteAction(a._id);
      }
    } else {
      response = await deleteAction(action._id);
    }
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert(multipleActions ? 'Actions supprimées !' : 'Action supprimée !');
      this.onBack();
    }
  };

  isUpdateDisabled = (calledFrom) => {
    const { action } = this.state;
    const newAction = { ...action, ...this.castToAction(this.state) };
    if (JSON.stringify(action) !== JSON.stringify(newAction)) return false;
    return true;
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    const { routes } = navigation.dangerouslyGetState();
    Sentry.setContext('action', {});
    // FIXME there is no perfect solution yet to handle the navigation
    // fromRoute parameter is good but sometimes not so good...
    navigation.navigate(
      route.params.fromRoute === 'NewActionForm'
        ? routes[routes.length - 3].name // example [{ name: AcionsList },{ name: NewActionForm },{ name: Action }]
        : route.params.fromRoute
    );
    this.setState({ updating: false });
  };

  onGoBackRequested = async () => {
    const { dueAt, writingComment } = this.state;
    if (!dueAt) {
      Alert.alert("Vous devez rentrer une date d'échéance");
      this.setState({ updating: false });
      return false;
    }

    if (writingComment.length) {
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
      return true;
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

  _scrollToInput = (ref) => {
    if (!ref) return;
    setTimeout(() => {
      ref.measureLayout(
        findNodeHandle(this.scrollView),
        (x, y, width, height) => {
          this.scrollView.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  getPersons() {
    const { action } = this.state;
    const { context, route } = this.props;
    if (route?.params?.actions?.length > 1) {
      return route?.params?.actions?.map((a) => context.persons.find((p) => p._id === a.person));
    } else if (Boolean(action.person)) {
      return [context.persons.find((p) => p._id === action.person)];
    }
    return [];
  }

  render() {
    const { loading, name, dueAt, withTime, description, categories, user, status, updating, editable, action } = this.state;
    const { navigation, context } = this.props;

    const persons = this.getPersons();

    return (
      <SceneContainer>
        <ScreenTitle
          title={persons?.length && persons.length === 1 ? `${name} - ${persons[0].name}` : name}
          onBack={this.onGoBackRequested}
          onEdit={!editable ? this.onEdit : null}
          onSave={!editable ? null : this.onUpdateAction}
          saving={updating}
        />
        <ScrollContainer ref={(r) => (this.scrollView = r)}>
          {loading ? (
            <Spinner />
          ) : (
            <>
              {!!user && <UserName metaCaption="Action ajoutée par" id={user?._id || user} />}
              <InputLabelled
                label="Nom de l’action"
                onChangeText={(name) => this.setState({ name })}
                value={name}
                placeholder="Nom de l’action"
                editable={editable}
              />
              {persons.length < 2 ? (
                <InputFromSearchList
                  label="Personne concernée"
                  value={persons[0]?.name || '-- Aucune --'}
                  onSearchRequest={this.onSearchPerson}
                  editable={editable}
                />
              ) : (
                <>
                  <Label label="Personne(s) concerné(es)" />
                  <Tags
                    data={persons}
                    onChange={(persons) => this.setState({ persons })}
                    onAddRequest={this.onSearchPerson}
                    renderTag={(person) => <MyText>{person?.name}</MyText>}
                  />
                </>
              )}
              <ActionStatusSelect
                onSelect={(status) => this.setState({ status })}
                onSelectAndSave={(status) => this.setState({ status }, this.onUpdateAction)}
                value={status}
                editable={editable}
              />
              <DateAndTimeInput
                label="Échéance"
                setDate={(dueAt) => this.setState({ dueAt })}
                date={dueAt}
                showTime
                showDay
                withTime={withTime}
                setWithTime={(withTime) => this.setState({ withTime })}
                editable={editable}
              />
              <InputLabelled
                label="Description"
                onChangeText={(description) => this.setState({ description })}
                value={description}
                placeholder="Description"
                multiline
                editable={editable}
                ref={(r) => (this.descriptionRef = r)}
                onFocus={() => this._scrollToInput(this.descriptionRef)}
              />
              <ActionCategoriesMultiCheckboxes onChange={(categories) => this.setState({ categories })} values={categories} editable={editable} />
              {!editable && <Spacer />}
              <ButtonsContainer>
                <ButtonDelete onPress={this.onDeleteRequest} />
                <Button
                  caption={editable ? 'Mettre-à-jour' : 'Modifier'}
                  onPress={editable ? this.onUpdateAction : this.onEdit}
                  disabled={editable ? this.isUpdateDisabled('modifier') : false}
                  loading={updating}
                />
              </ButtonsContainer>
              <SubList
                label="Commentaires"
                key={action._id}
                data={context.comments.filter((c) => c.action === action._id)}
                renderItem={(comment, index) => (
                  <CommentRow
                    key={index}
                    comment={comment.comment}
                    id={comment._id}
                    createdAt={comment.createdAt}
                    user={comment.user}
                    metaCaption="Commentaire de"
                    onUpdate={
                      comment.team
                        ? () =>
                            navigation.push('ActionComment', {
                              ...comment,
                              name,
                              fromRoute: 'Action',
                            })
                        : null
                    }
                  />
                )}
                ifEmpty="Pas encore de commentaire">
                {this.props.route?.params?.actions?.length < 1 ? (
                  <NewCommentInput
                    forwardRef={(r) => (this.newCommentRef = r)}
                    onFocus={() => this._scrollToInput(this.newCommentRef)}
                    action={action._id}
                    writeComment={(writingComment) => this.setState({ writingComment })}
                  />
                ) : (
                  <></>
                )}
              </SubList>
            </>
          )}
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default compose(withContext(ActionsContext), withContext(PersonsContext), withContext(CommentsContext), withContext(AuthContext))(Action);
