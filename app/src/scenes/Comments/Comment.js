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
import { commentsState } from '../../recoil/comments';
import { currentTeamState } from '../../recoil/auth';
import API from '../../services/api';

const Comment = ({ navigation, route, writeComment: writeCommentProp }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const [comments, setComments] = useRecoilState(commentsState);
  const commentDB = useMemo(() => comments.find((c) => c._id === route.params?._id), [comments, route?.params]);

  const [comment, setComment] = useState(route?.params?.comment?.split('\\n').join('\u000A') || '');
  const [updating, setUpdating] = useState(false);

  const isUpdateDisabled = useMemo(() => {
    if (commentDB?.comment !== comment.comment) return false;
    return true;
  }, [comment, commentDB]);

  const onUpdateComment = async () => {
    setUpdating(true);
    const response = await this.props.context.updateComment({
      comment: comment.trim(),
      team: currentTeam._id,
      _id: commentDB._id,
      entityKey: commentDB.entityKey,
    });
    if (response.error) {
      setUpdating(false);
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      setUpdating(false);
      Alert.alert('Commentaire mis-à-jour !', null, [{ text: 'OK', onPress: this.onBack }]);
    }
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
        onPress: onUpdateComment,
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

  const writeComment = (newComment) => {
    setComment(newComment);
    writeCommentProp?.(newComment);
  };

  return (
    <SceneContainer>
      <ScreenTitle title={`${route?.params?.name} - Commentaire`} onBack={onGoBackRequested} />
      <ScrollContainer>
        <View>
          <InputLabelled label="Commentaire" onChangeText={writeComment} value={comment} placeholder="Description" multiline />
          <ButtonsContainer>
            <ButtonDelete onPress={onDeleteRequest} />
            <Button caption="Mettre-à-jour" onPress={onUpdateComment} disabled={isUpdateDisabled} loading={updating} />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default Comment;
