import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { CANCEL, TODO } from '../../contexts/actions';
import ActionCategoriesMultiCheckboxes from '../../components/MultiCheckBoxes/ActionCategoriesMultiCheckboxes';
import Label from '../../components/Label';
import Tags from '../../components/Tags';
import { MyText } from '../../components/MyText';
import { actionsState, DONE, prepareActionForEncryption } from '../../recoil/actions';
import { useRecoilState, useRecoilValue } from 'recoil';
import { personsState } from '../../recoil/persons';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import API from '../../services/api';
import { currentTeamState, organisationState, usersState } from '../../recoil/auth';
import { capture } from '../../services/sentry';

const castToAction = (action = {}) => ({
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

const Action = ({ navigation, route }) => {
  const [actions, setActions] = useRecoilState(actionsState);
  const user = useRecoilValue(usersState);
  const organisation = useRecoilValue(organisationState);
  const allPersons = useRecoilValue(personsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const currentTeam = useRecoilValue(currentTeamState);

  const actionRef = useRef({});
  const oldAction = actionRef?.current;
  const [action, setAction] = useState(castToAction(route?.params));
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [writingComment, setWritingComment] = useState('');
  const [editable, setEditable] = useState(route?.params?.editable || false);

  const isUpdateDisabled = useMemo(() => {
    const newAction = { ...oldAction, ...castToAction(action) };
    if (JSON.stringify(oldAction) !== JSON.stringify(newAction)) return false;
    return true;
  }, [oldAction, action]);

  const backRequestHandledRef = useRef(false);
  const onBack = () => {
    backRequestHandledRef.current = true;
    const { routes } = navigation.dangerouslyGetState();
    Sentry.setContext('action', {});
    // FIXME there is no perfect solution yet to handle the navigation
    // fromRoute parameter is good but sometimes not so good...
    navigation.navigate(
      route.params.fromRoute === 'NewActionForm'
        ? routes[routes.length - 3].name // example [{ name: AcionsList },{ name: NewActionForm },{ name: Action }]
        : route.params.fromRoute
    );
    setUpdating(false);
  };

  const onGoBackRequested = async () => {
    if (!action.dueAt) {
      Alert.alert("Vous devez rentrer une date d'échéance");
      setUpdating(false);
      setUpdating(false);
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
    if (isUpdateDisabled) {
      onBack();
      return true;
    }
    Alert.alert('Voulez-vous enregistrer cette action ?', null, [
      {
        text: 'Enregistrer',
        onPress: onUpdateActionRequest,
      },
      {
        text: 'Ne pas enregistrer',
        onPress: onBack,
        style: 'destructive',
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onSearchPerson = () =>
    navigation.push('Persons', {
      screen: 'PersonsSearch',
      params: { fromRoute: 'Action' },
    });

  const handleBeforeRemove = (e) => {
    if (backRequestHandledRef.current === true) return;
    e.preventDefault();
    onGoBackRequested();
  };

  const handleFocus = () => {
    if (route.params?.person) {
      setAction((a) => ({ ...a, person: route.params.person }));
    }
  };

  const focusListener = useRef(null);
  const beforeRemoveListener = useRef(null);
  useEffect(() => {
    const getAction = async () => {
      const { _id } = route.params;
      const actionDB = actions.find((a) => a._id === _id);
      if (!actionDB) return onBack();
      actionRef.current = Object.assign({}, castToAction(actionDB), { _id: actionDB._id });
      setAction(castToAction(actionDB));
      setLoading(false);
    };
    getAction();
    focusListener.current = navigation.addListener('focus', handleFocus);
    beforeRemoveListener.current = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      focusListener.current.remove();
      beforeRemoveListener.current.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAction = async (action, { oldAction = null } = {}) => {
    let response = null;
    if (!oldAction) oldAction = actions.find((a) => a._id === action._id);
    const statusChanged = action.status && oldAction.status !== action.status;
    try {
      if (statusChanged) {
        if ([DONE, CANCEL].includes(action.status)) {
          action.completedAt = new Date().toISOString();
        } else {
          action.completedAt = null;
        }
      }
      response = await API.put({
        path: `/action/${action._id}`,
        body: prepareActionForEncryption(action),
      });
      if (response.ok) {
        setActions((actions) =>
          actions.map((a) => {
            if (a._id === response.decryptedData._id) return response.decryptedData;
            return a;
          })
        );
      }
      if (!response?.ok) return;
      const newAction = response.decryptedData;
      if (!statusChanged) return;
      const comment = {
        comment: `${user.name} a changé le status de l'action: ${mappedIdsToLabels.find((status) => status._id === newAction.status)?.name}`,
        type: 'action',
        item: oldAction._id,
        action: oldAction._id,
        team: currentTeam._id,
        user: user._id,
        organisation: organisation._id,
      };
      const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
      if (commentResponse.ok) setComments((comments) => [commentResponse.decryptedData, ...comments]);
      return commentResponse;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating action', action } });
      return { ok: false, error: error.message };
    }
  };

  const onUpdateActionRequest = async () => {
    setUpdating(true);
    const multipleActions = route?.params?.actions?.length > 1;
    if (!action.dueAt) {
      Alert.alert("Vous devez rentrer une date d'échéance");
      setUpdating(false);
      return false;
    }
    let response;
    if (multipleActions) {
      // Update multiple actions.
      for (const a of route?.params?.actions) {
        response = await updateAction(
          Object.assign(
            {},
            castToAction(action),
            { completedAt: oldAction.status === TODO && action.status !== TODO ? new Date().toISOString() : null },
            { _id: a._id, person: a.person }
          )
        );
      }
    } else {
      response = await updateAction(
        Object.assign(
          {},
          castToAction(action),
          { completedAt: oldAction.status === TODO && action.status !== TODO ? new Date().toISOString() : null },
          { _id: oldAction._id }
        )
      );
    }

    if (response.error) {
      Alert.alert(response.error);
      setUpdating(false);
      return false;
    }
    if (response.ok) {
      setUpdating(false);
      if (oldAction.status !== CANCEL && action.status === CANCEL) {
        Alert.alert('Cette action est annulée, voulez-vous la dupliquer ?', 'Avec une date ultérieure par exemple', [
          { text: 'OK', onPress: onDuplicate },
          { text: 'Non merci !', onPress: onBack, style: 'cancel' },
        ]);
      } else {
        Alert.alert(multipleActions ? 'Actions mises à jour !' : 'Action mise à jour !', null, [{ text: 'OK', onPress: onBack }]);
        return true;
      }
      return true;
    }
  };

  const onDuplicate = async () => {
    setUpdating(true);
    const { name, person, dueAt, withTime } = action;
    const response = await API.post({
      path: '/action',
      body: prepareActionForEncryption({
        name,
        person,
        team: currentTeam._id,
        dueAt,
        withTime,
        status: TODO,
      }),
    });
    if (!response.ok) {
      capture('error in creating action' + error, { extra: { error, action } });
      Alert.alert('Impossible de dupliquer !');
      return;
    }
    setActions((actions) => [response.decryptedData, ...actions]);
    Sentry.setContext('action', { _id: response.data._id });
    backRequestHandledRef.current = true;
    navigation.replace('Action', {
      ...response.data,
      fromRoute: 'ActionsList',
      editable: true,
    });
  };

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer cette action ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const deleteAction = async (id) => {
    const res = await API.delete({ path: `/action/${id}` });
    if (res.ok) {
      setActions((actions) => actions.filter((a) => a._id !== id));
      for (let comment of comments.filter((c) => c.action === id)) {
        const res = await API.delete({ path: `/comment/${comment._id}` });
        if (res.ok) setComments((comments) => comments.filter((p) => p._id !== comment._id));
        return res;
      }
    }
    return res;
  };

  const onDelete = async () => {
    const multipleActions = route?.params?.actions?.length > 1;
    let response;
    if (multipleActions) {
      for (const a of route?.params?.actions) {
        response = await deleteAction(a._id);
      }
    } else {
      response = await deleteAction(oldAction._id);
    }
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert(multipleActions ? 'Actions supprimées !' : 'Action supprimée !');
      onBack();
    }
  };

  const scrollViewRef = useRef(null);
  const descriptionRef = useRef(null);
  const newCommentRef = useRef(null);
  const _scrollToInput = (ref) => {
    if (!ref.current) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.current.measureLayout(
        findNodeHandle(scrollViewRef.current),
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  const persons = useMemo(() => {
    if (route?.params?.actions?.length > 1) {
      return route?.params?.actions?.map((a) => allPersons.find((p) => p._id === a.person));
    } else if (oldAction.person) {
      return [allPersons.find((p) => p._id === oldAction.person)];
    }
    return [];
  }, [route?.params?.actions, allPersons]);

  const canComment = !route?.params?.actions || route?.params?.actions?.length <= 1;

  const { name, dueAt, withTime, description, categories, user, status } = action;

  return (
    <SceneContainer>
      <ScreenTitle
        title={persons?.length && persons.length === 1 ? `${name} - ${persons[0].name}` : name}
        onBack={onGoBackRequested}
        onEdit={!editable ? setEditable(true) : null}
        onSave={!editable ? null : onUpdateActionRequest}
        saving={updating}
      />
      <ScrollContainer ref={scrollViewRef}>
        {loading ? (
          <Spinner />
        ) : (
          <>
            {!!user && <UserName metaCaption="Action ajoutée par" id={user?._id || user} />}
            <InputLabelled
              label="Nom de l’action"
              onChangeText={(name) => setAction((a) => ({ ...a, name }))}
              value={name}
              placeholder="Nom de l’action"
              editable={editable}
            />
            {persons.length < 2 ? (
              <InputFromSearchList
                label="Personne concernée"
                value={persons[0]?.name || '-- Aucune --'}
                onSearchRequest={onSearchPerson}
                editable={editable}
              />
            ) : (
              <>
                <Label label="Personne(s) concerné(es)" />
                <Tags
                  data={persons}
                  onChange={(persons) => setAction((a) => ({ ...a, persons }))}
                  onAddRequest={onSearchPerson}
                  renderTag={(person) => <MyText>{person?.name}</MyText>}
                />
              </>
            )}
            <ActionStatusSelect
              onSelect={(status) => setAction((a) => ({ ...a, status }))}
              onSelectAndSave={(status) => {
                setAction((a) => ({ ...a, status }));
                onUpdateActionRequest();
              }}
              value={status}
              editable={editable}
            />
            <DateAndTimeInput
              label="Échéance"
              setDate={(dueAt) => setAction((a) => ({ ...a, dueAt }))}
              date={dueAt}
              showTime
              showDay
              withTime={withTime}
              setWithTime={(withTime) => setAction((a) => ({ ...a, withTime }))}
              editable={editable}
            />
            <InputLabelled
              label="Description"
              onChangeText={(description) => setAction((a) => ({ ...a, description }))}
              value={description}
              placeholder="Description"
              multiline
              editable={editable}
              ref={descriptionRef}
              onFocus={() => _scrollToInput(descriptionRef)}
            />
            <ActionCategoriesMultiCheckboxes
              onChange={(categories) => setAction((a) => ({ ...a, categories }))}
              values={categories}
              editable={editable}
            />
            {!editable && <Spacer />}
            <ButtonsContainer>
              <ButtonDelete onPress={onDeleteRequest} />
              <Button
                caption={editable ? 'Mettre-à-jour' : 'Modifier'}
                onPress={editable ? onUpdateActionRequest : setEditable(true)}
                disabled={editable ? isUpdateDisabled : false}
                loading={updating}
              />
            </ButtonsContainer>
            <SubList
              label="Commentaires"
              key={oldAction._id}
              data={comments.filter((c) => c.action === oldAction._id)}
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
              {!!canComment && (
                <NewCommentInput
                  forwardRef={newCommentRef}
                  onFocus={() => _scrollToInput(newCommentRef)}
                  action={oldAction._id}
                  writeComment={setWritingComment}
                />
              )}
            </SubList>
          </>
        )}
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Action;
