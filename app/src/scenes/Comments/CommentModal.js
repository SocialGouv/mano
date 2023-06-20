import React, { useMemo, useState } from 'react';
import { Alert, View, Modal, Keyboard } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import { useRecoilValue } from 'recoil';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import DateAndTimeInput from '../../components/DateAndTimeInput';

const CommentModal = ({ title = 'Commentaire', visible, commentDB, onClose, onUpdate, onDelete, canToggleUrgentCheck, canToggleGroupCheck }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  const [comment, setComment] = useState(commentDB?.comment?.split('\\n').join('\u000A') || '');
  const [urgent, setUrgent] = useState(commentDB?.urgent || false);
  const [date, setDate] = useState((commentDB?.date || commentDB?.createdAt) ?? new Date());
  const [group, setGroup] = useState(commentDB?.group || false);
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
    const body = {
      _id: commentDB._id,
      team: commentDB.team || currentTeam?._id,
      user: commentDB.user || user?._id,
      comment: comment.trim(),
      date,
      urgent,
      group,
    };
    if (commentDB.type) body.type = commentDB.type;
    if (!body.user) body.user = user._id;
    if (!body.team) body.team = currentTeam._id;
    if (!body.organisation) body.organisation = organisation._id;
    const success = await onUpdate(body);
    Keyboard.dismiss();
    setUpdating(false);
    if (success) Alert.alert('Commentaire mis à jour !', null, [{ text: 'OK', onPress: onClose }]);
  };

  const onDeleteConfirm = async () => {
    const success = await onDelete(commentDB);
    if (!success) return;
    Alert.alert('Commentaire supprimé !');
    onClose();
  };

  const onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce commentaire ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onDeleteConfirm,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onGoBackRequested = () => {
    if (isUpdateDisabled) {
      onClose();
      return;
    }
    Alert.alert('Voulez-vous enregistrer ce commentaire ?', null, [
      {
        text: 'Enregistrer',
        onPress: onUpdateComment,
      },
      {
        text: 'Ne pas enregistrer',
        onPress: onClose,
        style: 'destructive',
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  return (
    <Modal animationType="fade" visible={!!visible}>
      <SceneContainer>
        <ScreenTitle title={title} onBack={onGoBackRequested} testID="comment" />
        <ScrollContainer>
          <View>
            <InputLabelled label="Commentaire" onChangeText={setComment} value={comment} placeholder="Description" multiline />
            {!!canToggleUrgentCheck && (
              <CheckboxLabelled
                label="Commentaire prioritaire (ce commentaire sera mis en avant par rapport aux autres)"
                alone
                onPress={() => setUrgent((u) => !u)}
                value={urgent}
              />
            )}
            <DateAndTimeInput label="Créé le / Concerne le" setDate={(a) => setDate(a)} date={date} showTime showDay withTime />
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
              <Button caption="Mettre à jour" onPress={onUpdateComment} disabled={isUpdateDisabled} loading={updating} />
            </ButtonsContainer>
          </View>
        </ScrollContainer>
      </SceneContainer>
    </Modal>
  );
};

export default CommentModal;
