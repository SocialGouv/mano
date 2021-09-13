import React from 'react';
import styled from 'styled-components';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import ButtonRight from '../../components/ButtonRight';
import { Alert } from 'react-native';
import { MyText } from '../../components/MyText';
import colors from '../../utils/colors';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import CommentsContext from '../../contexts/comments';
import UserName from '../../components/UserName';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const CommentRow = ({ onArrowPress, onPress, onUpdate, comment, createdAt, user, context, showActionSheetWithOptions, id, metaCaption }) => {
  const onPressRequest = async () => {
    if (onPress) return onPress();
    const options = ['Supprimer', 'Annuler'];
    if (onUpdate && user === context.user._id) options.unshift('Modifier');
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
        onPress: () => onCommentDelete(),
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onCommentDelete = async () => {
    const response = await context.deleteComment(commentDB._id);
    if (!response.ok) {
      return Alert.alert(response.error);
    }
  };

  return (
    <Container>
      <CaptionsContainer>
        <CommentStyled>{comment?.split('\\n')?.join('\u000A')}</CommentStyled>
        <CreationDate>
          {!!user && <UserName caption={metaCaption} id={user?._id || user} />}
          {'\u000A'}
          {new Date(createdAt).getLocaleDateAndTime('fr')}
        </CreationDate>
      </CaptionsContainer>
      {!!onArrowPress && <ButtonRight onPress={onArrowPress} caption=">" />}
      <OnMoreContainer hitSlop={hitSlop} onPress={onPressRequest}>
        <Dot />
        <Dot />
        <Dot />
      </OnMoreContainer>
    </Container>
  );
};

const Container = styled.View`
  background-color: #f4f5f8;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  margin-horizontal: 30px;
  margin-vertical: 8px;
`;

const CaptionsContainer = styled.View`
  padding-top: 25px;
  padding-bottom: 5px;
  padding-horizontal: 15px;
  flex-grow: 1;
  /* flex-basis: 100%; */
  align-items: flex-start;
`;

const CommentStyled = styled(MyText)`
  font-size: 17px;
  margin-bottom: 5px;
  flex-grow: 1;
  color: rgba(30, 36, 55, 0.75);
  text-align: justify;
`;

const CreationDate = styled(MyText)`
  font-style: italic;
  margin-left: auto;
  margin-top: 10px;
  margin-bottom: 10px;
  margin-right: 25px;
  text-align: right;
  color: ${colors.app.color};
`;

const OnMoreContainer = styled.TouchableOpacity`
  flex-direction: row;
  position: absolute;
  top: 16px;
  right: 8px;
`;

const Dot = styled.View`
  width: 3px;
  height: 3px;
  border-radius: 3px;
  background-color: rgba(30, 36, 55, 0.5);
  margin-right: 3px;
`;

export default compose(connectActionSheet, withContext(CommentsContext), withContext(AuthContext))(CommentRow);
