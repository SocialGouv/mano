import React from 'react';
import { Alert } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import TerritoryContext from '../../contexts/territory';
import withContext from '../../contexts/withContext';

class NewTerritoryForm extends React.Component {
  state = {
    name: '',
    posting: false,
  };
  componentDidMount() {
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

  onCreateTerritory = async () => {
    this.setState({ posting: true });
    const { name } = this.state;
    const response = await this.props.context.addTerritory({ name });
    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    if (response.ok) {
      this.backRequestHandled = true; // because when we go back from Action to ActionsList, we don't want the Back popup to be triggered
      const { navigation, route } = this.props;
      navigation.navigate('Territory', {
        fromRoute: route.params.fromRoute,
        ...response.data,
        editable: true,
      });
      setTimeout(() => {
        this.setState({ posting: false });
      }, 250);
    }
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
  };

  isReadyToSave = () => {
    const { name } = this.state;
    if (!name || !name.length || !name.trim().length) return false;
    return true;
  };

  onGoBackRequested = () => {
    if (!this.isReadyToSave()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer ce territoire ?', null, [
      {
        text: 'Enregistrer',
        onPress: this.onCreateTerritory,
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
  };

  render() {
    const { name, posting } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle title="Nouveau territoire" onBack={this.onGoBackRequested} />
        <ScrollContainer>
          <InputLabelled label="Nom" onChangeText={(name) => this.setState({ name })} value={name} placeholder="Station Stalingrad" />
          <Button caption="Créer" disabled={!this.isReadyToSave()} onPress={this.onCreateTerritory} loading={posting} />
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default withContext(TerritoryContext)(NewTerritoryForm);
