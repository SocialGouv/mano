import React, { useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import Button from '../../components/Button';
import InputMultilineAutoAdjust from '../../components/InputMultilineAutoAdjust';
import Spacer from '../../components/Spacer';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import API from '../../services/api';
import dayjs from 'dayjs';

const NewCommentInput = ({ person, action, forwardRef, onFocus, onCommentWrite }) => {
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const setComments = useSetRecoilState(commentsState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);

  const onCreateComment = async () => {
    setPosting(true);

    const body = {
      comment,
      date: dayjs(),
    };
    if (person) body.person = person;
    if (action) body.action = action;
    if (!body.user) body.user = user._id;
    if (!body.team) body.team = currentTeam._id;
    if (!body.organisation) body.organisation = organisation._id;
    const response = await API.post({ path: '/comment', body: prepareCommentForEncryption(body) });
    if (!response.ok) {
      setPosting(false);
      Alert.alert(response.error || response.code);
      return;
    }
    if (response.ok) {
      setComments((comments) => [response.decryptedData, ...comments]);
      Keyboard.dismiss();
      setPosting(false);
      setComment('');
      onCommentWrite?.('');
    }
  };

  const onCancelRequest = () => {
    Alert.alert('Voulez-vous abandonner la création de ce commentaire ?', null, [
      {
        text: 'Continuer la création',
      },
      {
        text: 'Abandonner',
        onPress: () => {
          setPosting(false);
          setComment('');
        },
        style: 'destructive',
      },
    ]);
  };

  const onChangeText = (newComment) => {
    setComment(newComment);
    onCommentWrite?.(newComment);
  };

  return (
    <>
      <InputMultilineAutoAdjust onChangeText={onChangeText} value={comment} placeholder="Ajouter un commentaire" ref={forwardRef} onFocus={onFocus} />
      {!!comment.length && (
        <>
          <Spacer />
          <ButtonsContainer>
            <ButtonDelete onPress={onCancelRequest} caption="Annuler" />
            <Button caption="Créer" onPress={onCreateComment} loading={posting} />
          </ButtonsContainer>
        </>
      )}
    </>
  );
};

export default NewCommentInput;
