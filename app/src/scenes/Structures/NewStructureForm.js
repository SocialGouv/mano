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

class NewStructureForm extends React.Component {
  state = {
    name: '',
    posting: false,
  };

  setNeedRefresh = () => {
    needRefresh.StructuresList = true;
  };

  onCreateStructure = async () => {
    this.setState({ posting: true });
    const { name } = this.state;
    const response = await API.post({ path: '/structure', body: { name } });

    if (response.error) {
      this.setState({ posting: false });
      Alert.alert(response.error);
      return;
    }
    
    if (response.ok) {
      this.setNeedRefresh();
      const { navigation, route } = this.props;
      navigation.navigate('Structure', {
        fromRoute: route.params.fromRoute,
        _id: response.data._id,
      });
      setTimeout(() => {
        this.setState({ posting: false });
      }, 250);
    }
  };

  onBack = () => {
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
    Alert.alert('Voulez-vous enregistrer cette structure ?', null, [
      {
        text: 'Enregistrer',
        onPress: this.onCreateStructure,
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
        <ScreenTitle
          title="Nouvelle structure"
          onBack={this.onGoBackRequested}
          backgroundColor={colors.structure.backgroundColor}
          color={colors.structure.color}
        />
        <ScrollContainer>
          <InputLabelled
            label="Nom"
            onChangeText={(name) => this.setState({ name })}
            value={name}
            placeholder="Hôpital du Centre"
          />
          <Button
            caption="Créer"
            disabled={!this.isReadyToSave()}
            onPress={this.onCreateStructure}
            backgroundColor={colors.structure.backgroundColor}
            color={colors.structure.color}
            loading={posting}
          />
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default NewStructureForm;
