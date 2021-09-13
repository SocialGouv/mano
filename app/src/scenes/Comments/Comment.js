import React from 'react';
import { Alert, View } from 'react-native';
import { compose } from 'recompose';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import CommentsContext from '../../contexts/comments';

class Comment extends React.Component {
  state = {
    commentDB: {},
    comment: this.props.route?.params?.comment?.split('\\n').join('\u000A'),
    loading: false,
    updating: false,
  };

  async componentDidMount() {
    await this.getComment();
    this.props.navigation.addListener('beforeRemove', this.handleBeforeRemove);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('beforeRemove', this.handleBeforeRemove);
  }

  handleBeforeRemove = (e) => {
    if (this.backRequestHandled) return;
    e.preventDefault();
    this.onGoBackRequested();
  };

  setComment = (commentDB) => {
    const { comment, _id } = commentDB;
    const original = {
      comment: comment?.trim().split('\\n').join('\u000A') || '',
      entityKey: comment.entityKey || '',
    };
    this.setState({
      commentDB: Object.assign({}, original, { _id }),
      ...original,
      loading: false,
    });
  };

  getComment = async () => {
    const { route, context } = this.props;
    const { _id } = route.params;
    const comment = context.comments.find((c) => c._id === _id);
    this.setComment(comment);
  };

  onUpdateComment = async () => {
    this.setState({ updating: true });
    const { comment, commentDB } = this.state;
    const response = await this.props.context.updateComment({
      comment: comment.trim(),
      team: this.props.context.currentTeam._id,
      _id: commentDB._id,
      entityKey: commentDB.entityKey,
    });
    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      this.setState({ updating: false });
      Alert.alert('Commentaire mis-à-jour !', null, [{ text: 'OK', onPress: this.onBack }]);
    }
  };

  onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce commentaire ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: this.onDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  onDelete = async () => {
    const { commentDB } = this.state;
    const response = await this.props.context.deleteComment(commentDB._id);
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Commentaire supprimé !');
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { comment, commentDB } = this.state;
    if (commentDB?.comment !== comment) return false;
    return true;
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
  };

  onGoBackRequested = () => {
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer ce commentaire ?', null, [
      {
        text: 'Enregistrer',
        onPress: this.onUpdateComment,
      },
      {
        text: 'Ne pas enregistrer',
        onPress: this.onBack,
        style: 'destructive',
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  writeComment = (newComment) => {
    this.setState({ comment: newComment });
    this.props.writeComment?.(newComment);
  };

  render() {
    const { comment, loading, updating } = this.state;
    const { name } = this.props.route.params;
    if (loading) return <Spinner />;
    return (
      <SceneContainer>
        <ScreenTitle title={`${name} - Commentaire`} onBack={this.onGoBackRequested} />
        <ScrollContainer>
          <View>
            <InputLabelled label="Commentaire" onChangeText={this.writeComment} value={comment} placeholder="Description" multiline />
            <ButtonsContainer>
              <ButtonDelete onPress={this.onDeleteRequest} />
              <Button caption="Mettre-à-jour" onPress={this.onUpdateComment} disabled={this.isUpdateDisabled()} loading={updating} />
            </ButtonsContainer>
          </View>
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default compose(withContext(AuthContext), withContext(CommentsContext))(Comment);
