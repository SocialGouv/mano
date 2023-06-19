import React, { useState } from 'react';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../../recoil/auth';
import BubbleRow from '../../components/BubbleRow';
import CommentModal from './CommentModal';

const CommentRow = ({
  onUpdate,
  onDelete,
  comment,
  showActionSheetWithOptions,
  itemName,
  onItemNamePress,
  canToggleUrgentCheck,
  canToggleGroupCheck,
}) => {
  const organisation = useRecoilValue(organisationState);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const onMorePress = async () => {
    const options = ['Annuler'];
    if (onDelete) options.unshift('Supprimer');
    if (onUpdate) options.unshift('Modifier');
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: options.findIndex((o) => o === 'Supprimer'),
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') setUpdateModalVisible(true);
        if (options[buttonIndex] === 'Supprimer') onCommentDeleteRequest();
      }
    );
  };

  const onCommentDeleteRequest = () => {
    Alert.alert('Voulez-vous supprimer ce commentaire ?', 'Cette opération est irréversible.', [
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

  return (
    <>
      <BubbleRow
        onMorePress={onDelete || onUpdate ? onMorePress : null}
        caption={comment.comment}
        date={comment.date || comment.createdAt}
        user={comment.user}
        urgent={comment.urgent}
        group={!!organisation.groupsEnabled && comment.group}
        itemName={itemName}
        onItemNamePress={onItemNamePress}
        metaCaption="Commentaire de"
      />
      <CommentModal
        visible={updateModalVisible}
        commentDB={comment}
        onClose={() => setUpdateModalVisible(false)}
        title="Commentaire"
        canToggleUrgentCheck={canToggleUrgentCheck}
        canToggleGroupCheck={canToggleGroupCheck}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  );
};

export default connectActionSheet(CommentRow);
