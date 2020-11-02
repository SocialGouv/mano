import React from 'react';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../api';
import colors from '../../utils/colors';
import needRefresh from '../../utils/needRefresh';

class NewCommentForm extends React.Component {
  state = {
    comment: '',
    posting: false,
  };

  onCreateComment = async () => {
    this.setState({ posting: true });
    const { comment } = this.state;
    const { person, action, fromRoute } = this.props.route.params;
    const body = { comment };
    if (person) body.person = person._id;
    if (action) body.action = action._id;
    const response = await API.post({ path: '/comment', body });
    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      needRefresh[fromRoute] = true;
      this.onBack();
    }
  };

  onBack = () => {
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
    setTimeout(() => {
      this.setState({ posting: false });
    }, 250);
  };

  isReadyToSave = () => {
    const { comment } = this.state;
    if (!comment || !comment.length || !comment.trim().length) return false;
    return true;
  };

  onGoBackRequested = () => {
    if (!this.isReadyToSave()) {
      this.onBack();
      return;
    }

    if (this.isReadyToSave()) {
      Alert.alert('Voulez-vous enregistrer ce commentaire ?', null, [
        {
          text: 'Enregistrer',
          onPress: this.onCreateComment,
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
      return;
    }
    Alert.alert('Voulez-vous abandonner la création de ce commentaire ?', null, [
      {
        text: 'Continuer la création',
      },
      {
        text: 'Abandonner',
        onPress: this.onBack,
        style: 'destructive',
      },
    ]);
  };

  render() {
    const { comment, posting } = this.state;
    const { person, action } = this.props.route.params;
    const { name } = person || action;
    return (
      <SceneContainer>
        <ScreenTitle
          title={`Nouveau commentaire - ${name}`}
          onBack={this.onGoBackRequested}
          backgroundColor={colors[person ? 'person' : 'action'].backgroundColor}
          color={colors[person ? 'person' : 'action'].color}
        />
        <ScrollContainer>
          <InputLabelled
            label="Commentaire"
            onChangeText={(newComment) => this.setState({ comment: newComment })}
            value={comment}
            placeholder="Description"
            multiline
          />
          <Button
            caption="Créer"
            disabled={!this.isReadyToSave()}
            onPress={this.onCreateComment}
            backgroundColor={colors[person ? 'person' : 'action'].backgroundColor}
            color={colors[person ? 'person' : 'action'].color}
            loading={posting}
          />
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default NewCommentForm;
