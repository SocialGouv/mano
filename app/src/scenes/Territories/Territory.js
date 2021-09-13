import React from 'react';
import { Alert, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import TerritoryMultiCheckBoxes from '../../components/MultiCheckBoxes/TerritoryMultiCheckBoxes';
import SubList from '../../components/SubList';
import { compose } from 'recompose';
import TerritoryObservationRow from './TerritoryObservationRow';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import TerritoryContext from '../../contexts/territory';
import TerritoryObservationsContext from '../../contexts/territoryObservations';

class Territory extends React.Component {
  castToTerritory = (territory = {}) => ({
    name: territory.name?.trim() || '',
    types: territory.types || [],
    perimeter: territory.perimeter?.trim() || '',
    entityKey: territory.entityKey || '',
  });

  state = {
    territory: {},
    ...this.castToTerritory(this.props.route?.params),

    loading: false,
    updating: false,
    editable: this.props.route?.params?.editable || false,
  };

  componentDidMount() {
    this.getTerritory();
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

  onEdit = () => this.setState(({ editable }) => ({ editable: !editable }));

  setTerritory = (territoryDB) => {
    this.setState({
      territory: Object.assign({}, this.castToTerritory(territoryDB), { _id: territoryDB._id }),
      ...this.castToTerritory(territoryDB),
      loading: false,
    });
  };

  getTerritory = async () => {
    const { _id } = this.props.route.params;
    this.setTerritory(this.props.context.territories.find((territory) => territory._id === _id));
  };

  onUpdateTerritory = async () => {
    this.setState({ updating: true });
    const { territory } = this.state;
    const response = await this.props.context.updateTerritory(Object.assign({}, this.castToTerritory(this.state), { _id: territory._id }));
    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      Alert.alert('Territoire mise-à-jour !');
      this.setTerritory(response.data);
      this.setState({ updating: false, editable: false });
      return true;
    }
  };

  onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer ce territoire ?', 'Cette opération est irréversible.', [
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
    const { territory } = this.state;
    const { context } = this.props;
    const response = await context.deleteTerritory(territory._id);
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Territoire supprimé !');
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { territory } = this.state;
    const newTerritory = { ...territory, ...this.castToTerritory(this.state) };
    if (JSON.stringify(territory) !== JSON.stringify(newTerritory)) return false;
    return true;
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute);
  };

  onNewObservation = () => {
    const { navigation } = this.props;
    const { territory } = this.state;
    navigation.navigate('TerritoryObservation', { territory, editable: true });
  };

  onUpdateObservation = (observation) => {
    const { navigation } = this.props;
    const { territory } = this.state;
    navigation.navigate('TerritoryObservation', { ...observation, territory, editable: true });
  };

  onGoBackRequested = () => {
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer ce territoire ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await this.onUpdateTerritory();
          if (ok) this.onBack();
        },
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
    const { loading, name, territory, types, perimeter, updating, editable } = this.state;
    const { territoryObservations } = this.props.context;

    return (
      <SceneContainer>
        <ScreenTitle
          title={name}
          onBack={this.onGoBackRequested}
          onEdit={!editable ? this.onEdit : null}
          onSave={!editable ? null : this.onUpdateTerritory}
          saving={updating}
        />
        <ScrollContainer>
          {loading ? (
            <Spinner />
          ) : (
            <View>
              {!!editable && (
                <InputLabelled
                  label="Nom"
                  onChangeText={(name) => this.setState({ name })}
                  value={name}
                  placeholder="Nom"
                  textContentType="organizationName"
                  editable={editable}
                />
              )}
              <TerritoryMultiCheckBoxes values={types} onChange={(types) => this.setState({ types })} editable={editable} />
              <InputLabelled
                label="Perimètre"
                onChangeText={(perimeter) => this.setState({ perimeter })}
                value={perimeter}
                placeholder="De la rue XXX à la rue XXX"
                editable={editable}
              />
              <ButtonsContainer>
                <ButtonDelete onPress={this.onDeleteRequest} />
                <Button
                  caption={editable ? 'Mettre-à-jour' : 'Modifier'}
                  onPress={editable ? this.onUpdateTerritory : this.onEdit}
                  disabled={editable ? this.isUpdateDisabled() : false}
                  loading={updating}
                />
              </ButtonsContainer>
              <SubList
                label="Observations"
                key={territory._id}
                data={territoryObservations.filter((obs) => obs.territory === territory._id)}
                renderItem={(obs, index) => <TerritoryObservationRow key={index} observation={obs} onUpdate={this.onUpdateObservation} />}
                ifEmpty="Pas encore d'observation">
                <Button caption="Nouvelle observation" onPress={this.onNewObservation} />
              </SubList>
            </View>
          )}
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

export default compose(withContext(TerritoryContext), withContext(TerritoryObservationsContext), withContext(AuthContext))(Territory);
