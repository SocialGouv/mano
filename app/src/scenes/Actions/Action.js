import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import styled from 'styled-components';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
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
import ActionCategoriesMultiCheckboxes from '../../components/MultiCheckBoxes/ActionCategoriesMultiCheckboxes';
import Label from '../../components/Label';
import Tags from '../../components/Tags';
import { MyText } from '../../components/MyText';
import { actionsState, DONE, CANCEL, TODO, prepareActionForEncryption, mappedIdsToLabels } from '../../recoil/actions';
import { useRecoilState, useRecoilValue } from 'recoil';
import { personsState } from '../../recoil/persons';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import API from '../../services/api';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { capture } from '../../services/sentry';
import CheckboxLabelled from '../../components/CheckboxLabelled';

const castToAction = (action) => {
  if (!action) action = {};
  return {
    name: action.name?.trim() || '',
    description: action.description?.trim()?.split('\\n').join('\u000A') || '',
    person: action.person || null,
    categories: action.categories || [],
    user: action.user || null,
    status: action.status || TODO,
    dueAt: action.dueAt || null,
    withTime: action.withTime || false,
    urgent: action.urgent || false,
    completedAt: action.completedAt || null,
    entityKey: action.entityKey || '',
    team: action.team || null,
    structure: action.structure || null,
  };
};

const Action = ({ navigation, route }) => {
  const [actions, setActions] = useRecoilState(actionsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const allPersons = useRecoilValue(personsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const currentTeam = useRecoilValue(currentTeamState);

  const actionDB = useMemo(() => {
    const existingAction = actions.find((a) => a._id === route.params?._id);
    if (!existingAction) return {};
    return Object.assign({}, castToAction(existingAction), { _id: existingAction._id });
  }, [actions, route.params]);

  const [action, setAction] = useState(() => castToAction(actionDB));
  const [updating, setUpdating] = useState(false);
  const [writingComment, setWritingComment] = useState('');
  const [editable, setEditable] = useState(route?.params?.editable || false);

  useEffect(() => {
    if (route?.params?.duplicate) {
      Alert.alert(
        "L'action est dupliquée, vous pouvez la modifier !",
        "Les commentaires de l'action aussi sont dupliqués. L'action originale est annulée"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUpdateDisabled = useMemo(() => {
    const newAction = { ...actionDB, ...castToAction(action) };
    if (JSON.stringify(actionDB) !== JSON.stringify(newAction)) return false;
    return true;
  }, [actionDB, action]);

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

  const onSearchPerson = () => navigation.push('PersonsSearch', { fromRoute: 'Action' });

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

  useEffect(() => {
    const focusListenerUnsubscribe = navigation.addListener('focus', handleFocus);
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      focusListenerUnsubscribe();
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.person]);

  const updateAction = async (action, { oldAction = null } = {}) => {
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
      const response = await API.put({
        path: `/action/${oldAction._id}`,
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
      if (!response?.ok) return response;
      const newAction = response.decryptedData;
      if (!statusChanged) return response;

      const comment = {
        comment: `${user.name} a changé le status de l'action: ${mappedIdsToLabels.find((status) => status._id === newAction.status)?.name}`,
        action: actionDB?._id,
        team: currentTeam._id,
        user: user._id,
        organisation: organisation._id,
      };
      const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
      if (commentResponse.ok) setComments((comments) => [commentResponse.decryptedData, ...comments]);
      return response;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating action', action } });
      return { ok: false, error: error.message };
    }
  };

  const onUpdateActionRequest = async () => {
    setUpdating(true);
    const multipleActions = route?.params?.actions?.length > 1;
    if (!action.name.trim()) {
      Alert.alert("Vous devez rentrer un nom d'action");
      setUpdating(false);
      return false;
    }
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
            { completedAt: actionDB.status === TODO && action.status !== TODO ? new Date().toISOString() : null },
            { _id: a._id, person: a.person, team: currentTeam._id }
          )
        );
      }
    } else {
      response = await updateAction(
        Object.assign(
          {},
          castToAction(action),
          { completedAt: actionDB.status === TODO && action.status !== TODO ? new Date().toISOString() : null },
          { _id: actionDB?._id, team: currentTeam._id }
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
      if (actionDB.status !== CANCEL && action.status === CANCEL) {
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

  useEffect(() => {
    if (!editable) {
      if (action.status !== actionDB.status) onUpdateActionRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, action.status]);

  const onDuplicate = async () => {
    setUpdating(true);
    const { name, person, dueAt, withTime, description, categories, urgent } = action;
    const response = await API.post({
      path: '/action',
      body: prepareActionForEncryption({
        name,
        person,
        team: currentTeam._id,
        user: user._id,
        dueAt,
        withTime,
        status: TODO,
        description,
        categories,
        urgent,
      }),
    });
    if (!response.ok) {
      Alert.alert('Impossible de dupliquer !');
      return;
    }
    setActions((actions) => [response.decryptedData, ...actions]);
    for (let c of comments.filter((c) => c.action === actionDB._id).filter((c) => !c.comment.includes('a changé le status'))) {
      const body = {
        comment: c.comment,
        action: response.decryptedData._id,
        user: c.user,
        team: c.team,
        organisation: c.organisation,
      };
      const res = await API.post({ path: '/comment', body: prepareCommentForEncryption(body) });
      if (res.ok) {
        setComments((comments) => [res.decryptedData, ...comments]);
      }
    }
    Sentry.setContext('action', { _id: response.decryptedData._id });
    backRequestHandledRef.current = true;
    navigation.replace('Action', {
      ...response.decryptedData,
      fromRoute: 'ActionsList',
      editable: true,
      duplicate: true,
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
      for (let comment of comments.filter((c) => c.action === id)) {
        const res = await API.delete({ path: `/comment/${comment._id}` });
        if (res.ok) {
          setComments((comments) => comments.filter((p) => p._id !== comment._id));
        }
      }
      setActions((actions) => actions.filter((a) => a._id !== id));
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
      response = await deleteAction(actionDB._id);
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
        scrollViewRef.current,
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
    } else if (action.person) {
      return [allPersons.find((p) => p._id === action.person)];
    }
    return [];
  }, [route?.params?.actions, allPersons, action?.person]);

  const canComment = !route?.params?.actions || route?.params?.actions?.length <= 1;

  const { name, dueAt, withTime, description, categories, status, urgent } = action;

  return (
    <SceneContainer>
      <ScreenTitle
        title={persons?.length && persons.length === 1 ? `${name} - ${persons[0]?.name}` : name}
        onBack={onGoBackRequested}
        onEdit={!editable ? () => setEditable(true) : null}
        onSave={!editable || isUpdateDisabled ? null : onUpdateActionRequest}
        saving={updating}
        testID="action"
      />
      <ScrollContainer ref={scrollViewRef}>
        {!!action.user && <UserName metaCaption="Action ajoutée par" id={action.user?._id || action.user} />}
        {!editable && urgent ? <Urgent bold>❗ Action prioritaire</Urgent> : null}
        <InputLabelled
          label="Nom de l’action"
          onChangeText={(name) => setAction((a) => ({ ...a, name }))}
          value={name}
          placeholder="Nom de l’action"
          editable={editable}
          testID="action-name"
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
        {editable ? (
          <CheckboxLabelled
            label="Action prioritaire (cette action sera mise en avant par rapport aux autres)"
            alone
            onPress={() => setAction((a) => ({ ...a, urgent: !a.urgent }))}
            value={urgent}
          />
        ) : null}

        {!editable && <Spacer />}
        <ButtonsContainer>
          <ButtonDelete onPress={onDeleteRequest} />
          <Button
            caption={editable ? 'Mettre à jour' : 'Modifier'}
            onPress={editable ? onUpdateActionRequest : () => setEditable(true)}
            disabled={editable ? isUpdateDisabled : false}
            loading={updating}
          />
        </ButtonsContainer>
        <SubList
          label="Commentaires"
          key={actionDB?._id}
          data={comments.filter((c) => c.action === actionDB?._id)}
          renderItem={(comment) => (
            <CommentRow
              key={comment._id}
              comment={comment}
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
              action={actionDB?._id}
              onCommentWrite={setWritingComment}
            />
          )}
        </SubList>
      </ScrollContainer>
    </SceneContainer>
  );
};

const Urgent = styled(MyText)`
  font-weight: bold;
  font-size: 17px;
  padding: 2px 5px;
  margin: 0 auto 20px;
  color: red;
`;

export default Action;
