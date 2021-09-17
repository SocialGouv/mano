import React from 'react';
import { Alert, Keyboard } from 'react-native';
import Button from '../../components/Button';
import InputMultilineAutoAdjust from '../../components/InputMultilineAutoAdjust';
import Spacer from '../../components/Spacer';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import withContext from '../../contexts/withContext';
import CommentsContext from '../../contexts/comments';

const initState = {
  comment: '',
  posting: false,
};
class NewCommentInput extends React.Component {
  state = initState;

  onCreateComment = async () => {
    this.setState({ posting: true });
    const { comment } = this.state;
    const { person, action, context } = this.props;

    let response;
    if (person) {
      response = await context.addComment({
        comment,
        person,
        item: person,
        type: 'person',
      });
    }
    if (action) {
      // Save comment for multiple actions
      if (Array.isArray(action)) {
        for (const a of action) {
          response = await context.addComment({
            comment,
            action: a,
            item: a,
            type: 'action',
          });
        }
      } else {
        response = await context.addComment({
          comment,
          action,
          item: action,
          type: 'action',
        });
      }
    }
    if (!response.ok) {
      this.setState({ posting: false });
      Alert.alert(response.error || response.code);
      return;
    }
    if (response.ok) {
      Keyboard.dismiss();
      this.setState(initState);
      this.props.writeComment?.('');
    }
  };

  onCancelRequest = () => {
    Alert.alert('Voulez-vous abandonner la création de ce commentaire ?', null, [
      {
        text: 'Continuer la création',
      },
      {
        text: 'Abandonner',
        onPress: () => this.setState(initState),
        style: 'destructive',
      },
    ]);
  };

  writeComment = (newComment) => {
    this.setState({ comment: newComment });
    this.props.writeComment?.(newComment);
  };

  render() {
    const { comment, posting } = this.state;
    const { forwardRef, onFocus } = this.props;
    return (
      <>
        <InputMultilineAutoAdjust
          onChangeText={this.writeComment}
          value={comment}
          placeholder="Ajouter un commentaire"
          ref={forwardRef}
          onFocus={onFocus}
        />
        {!!comment.length && (
          <>
            <Spacer />
            <ButtonsContainer>
              <ButtonDelete onPress={this.onCancelRequest} caption="Annuler" />
              <Button caption="Créer" onPress={this.onCreateComment} loading={posting} />
            </ButtonsContainer>
          </>
        )}
      </>
    );
  }
}

export default withContext(CommentsContext)(NewCommentInput);
