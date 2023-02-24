import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import { useRecoilState, useRecoilValue } from 'recoil';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import API from '../../services/api';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import { groupsState } from '../../recoil/groups';
import DateAndTimeInput from '../../components/DateAndTimeInput';

const Comment = ({ navigation, route, onCommentWrite }) => {
  const [comments, setComments] = useRecoilState(commentsState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const groups = useRecoilValue(groupsState);
  const commentDB = useMemo(() => comments.find((c) => c._id === route.params?._id), [comments, route?.params]);
  const isNewComment = useMemo(() => !commentDB, [commentDB]);
  const [comment, setComment] = useState(route?.params?.comment?.split('\\n').join('\u000A') || '');
  const [urgent, setUrgent] = useState(route?.params?.urgent || false);
  const [date, setDate] = useState((route?.params?.date || route?.params?.createdAt) ?? new Date());
  const [group, setGroup] = useState(route?.params?.group || false);
  const [updating, setUpdating] = useState(false);

  const isUpdateDisabled = useMemo(() => {
    if ((commentDB?.comment || '') !== comment) return false;
    if ((commentDB?.urgent || false) !== urgent) return false;
    if ((commentDB?.group || false) !== group) return false;
    if ((commentDB?.date || false) !== date) return false;
    return true;
  }, [comment, commentDB, urgent, group, date]);

  const onUpdateComment = async () => {
    setUpdating(true);
    const response = await API.put({
      path: `/comment/${commentDB._id}`,
      body: prepareCommentForEncryption({
        ...commentDB,
        team: commentDB.team || currentTeam?._id,
        user: commentDB.user || user?._id,
        comment: comment.trim(),
        date,
        urgent,
        group,
      }),
    });

    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setComments((comments) =>
        comments.map((c) => {
          if (c._id === commentDB._id) return response.decryptedData;
          return c;
        })
      );
      setUpdating(false);
      Alert.alert('Commentaire mis à jour !', null, [{ text: 'OK', onPress: onBack }]);
    }
    return response;
  };

  const onCreateComment = async () => {
    setUpdating(true);
    const response = await API.post({
      path: '/comment',
      body: prepareCommentForEncryption({
        comment: comment.trim(),
        person: route.params?.person?._id,
        action: route.params?.action?._id,
        user: user?._id,
        team: currentTeam?._id,
        urgent,
      }),
    });

    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setComments((comments) => [response.decryptedData, ...comments]);
      setUpdating(false);
      Alert.alert('Commentaire ajouté', null, [{ text: 'OK', onPress: onBack }]);
    }
    return response;
  };

  const onDelete = async () => {
    const response = await API.delete({ path: `/comment/${commentDB._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      setComments((comments) => comments.filter((p) => p._id !== commentDB._id));
      Alert.alert('Commentaire supprimé !');
      onBack();
    }
  };

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce commentaire ?', 'Cette opération est irréversible.', [
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

  const onBack = () => {
    backRequestHandledRef.current = true;
    navigation.navigate(route.params.fromRoute);
  };

  const onGoBackRequested = () => {
    if (isUpdateDisabled) {
      onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer ce commentaire ?', null, [
      {
        text: 'Enregistrer',
        onPress: isNewComment ? onCreateComment : onUpdateComment,
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

  const backRequestHandledRef = useRef(null);
  const handleBeforeRemove = (e) => {
    if (backRequestHandledRef.current === true) return;
    e.preventDefault();
    onGoBackRequested();
  };

  useEffect(() => {
    const beforeRemoveListenerUnsbscribe = navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      beforeRemoveListenerUnsbscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeText = (newComment) => {
    setComment(newComment);
    onCommentWrite?.(newComment);
  };

  const canToggleGroupCheck = !!organisation.groupsEnabled && groups.find((group) => group.persons.includes(route.params?.person));

  return (
    <SceneContainer>
      <ScreenTitle title={`${route?.params?.commentTitle} - Commentaire`} onBack={onGoBackRequested} testID="comment" />
      <ScrollContainer>
        <View>
          <InputLabelled label="Commentaire" onChangeText={onChangeText} value={comment} placeholder="Description" multiline />
          <CheckboxLabelled
            label="Commentaire prioritaire (ce commentaire sera mis en avant par rapport aux autres)"
            alone
            onPress={() => setUrgent((u) => !u)}
            value={urgent}
          />
          {!isNewComment && <DateAndTimeInput label="Créé le / Concerne le" setDate={(a) => setDate(a)} date={date} showTime showDay withTime />}
          {!!canToggleGroupCheck && (
            <CheckboxLabelled
              label="Commentaire familial (ce commentaire sera visible pour toute la famille)"
              alone
              onPress={() => setGroup((g) => !g)}
              value={group}
            />
          )}
          <ButtonsContainer>
            <ButtonDelete onPress={onDeleteRequest} />
            <Button
              caption={isNewComment ? 'Créer' : 'Mettre à jour'}
              onPress={isNewComment ? onCreateComment : onUpdateComment}
              disabled={isUpdateDisabled}
              loading={updating}
            />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Comment;
