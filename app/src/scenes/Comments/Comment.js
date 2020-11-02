import React from 'react';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../api';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import needRefresh from '../../utils/needRefresh';

class Comment extends React.Component {
  state = {
    commentDB: {},
    comment: '',
    loading: true,
    updating: false,
  };

  needRefresh = false;

  async componentDidMount() {
    await this.getComment();
  }

  setComment = (commentDB) => {
    const { comment, _id } = commentDB;
    const original = { comment: comment || '' };
    this.setState({ commentDB: Object.assign({}, original, { _id }), ...original, loading: false });
  };

  getComment = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: `/comment/${_id}` });
    if (response.error) return Alert.alert(response.error);
    this.setComment(response.data);
  };

  onUpdateComment = async () => {
    this.setState({ updating: true });
    const { comment, commentDB } = this.state;
    const response = await API.put({
      path: `/comment/${commentDB._id}`,
      body: { comment: comment.trim() },
    });

    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      this.setNeedRefresh();
      this.setState({ updating: false });
      Alert.alert('Commentaire mis-à-jour !', null, [{ text: 'OK', onPress: this.onBack }]);
    }
  };

  onDeleteRequest = () => {
    Alert.alert(
      'Voulez-vous vraiment supprimer ce commentaire ?',
      'Cette opération est irréversible.',
      [
        { text: 'Supprimer', style: 'destructive', onPress: this.onDelete },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  onDelete = async () => {
    const { commentDB } = this.state;
    const response = await API.delete({ path: `/comment/${commentDB._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Commentaire supprimé !');
      this.setNeedRefresh();
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { comment, commentDB } = this.state;
    if (commentDB.comment !== comment) return false;
    return true;
  };

  setNeedRefresh = () => {
    needRefresh.ActionsList = true;
    needRefresh.PersonsList = true;
    needRefresh.Person = true;
    needRefresh.Action = true;
  };

  onBack = () => {
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

  render() {
    const { comment, loading, updating } = this.state;
    const { name } = this.props.route.params;
    if (loading) return <Spinner />;
    return (
      <SceneContainer>
        <ScreenTitle title={`${name} - Commentaire`} onBack={this.onGoBackRequested} />
        <ScrollContainer>
          <InputLabelled
            label="Commentaire"
            onChangeText={(newComment) => this.setState({ comment: newComment })}
            value={comment}
            placeholder="Description"
            multiline
          />
          <ButtonsContainer>
            <ButtonDelete onPress={this.onDeleteRequest} />
            <Button
              caption="Mettre-à-jour"
              onPress={this.onUpdateComment}
              disabled={this.isUpdateDisabled()}
              loading={updating}
            />
          </ButtonsContainer>
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default Comment;
