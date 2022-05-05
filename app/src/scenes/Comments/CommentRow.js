import React from 'react';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import { userState } from '../../recoil/auth';
import API from '../../services/api';
import { commentsState } from '../../recoil/comments';
import { storage } from '../../services/dataManagement';
import BubbleRow from '../../components/BubbleRow';

const CommentRow = ({ onUpdate, comment, showActionSheetWithOptions }) => {
  const user = useRecoilValue(userState);
  const [comments, setComments] = useRecoilState(commentsState);

  const onMorePress = async () => {
    const options = ['Supprimer', 'Annuler'];
    if (onUpdate && comment.user === user._id) options.unshift('Modifier');
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') onUpdate();
        if (options[buttonIndex] === 'Supprimer') onCommentDeleteRequest();
      }
    );
  };

  const onCommentDeleteRequest = () => {
    Alert.alert('Voulez-vous supprimer ce commentaire ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onCommentDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onCommentDelete = async () => {
    const response = await API.delete({ path: `/comment/${comment._id}` });
    if (!response.ok) return Alert.alert(response.error);
    setComments((comments) => comments.filter((p) => p._id !== comment._id));
    storage.set('comment', JSON.stringify(comments.filter((p) => p._id !== comment._id)));
  };

  return (
    <BubbleRow
      onMorePress={onMorePress}
      caption={comment.comment}
      date={comment.date || comment.createdAt}
      user={comment.user}
      metaCaption="Commentaire de"
    />
  );
};

export default connectActionSheet(CommentRow);
