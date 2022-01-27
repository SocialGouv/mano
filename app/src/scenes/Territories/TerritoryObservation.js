import React from 'react';
import { Alert, findNodeHandle, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import styled from 'styled-components';
import { MyText } from '../../components/MyText';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import TerritoryObservationsContext from '../../contexts/territoryObservations';
import CustomFieldInput from '../../components/CustomFieldInput';

const cleanValue = (value) => {
  if (typeof value === 'string') return (value || '').trim();
  return value;
};

class TerritoryObservation extends React.Component {
  castToTerritoryObservation = (territoryObservation = {}, customFieldsObs) => {
    const toReturn = {};
    for (const field of customFieldsObs) {
      toReturn[field.name] = cleanValue(territoryObservation[field.name]);
    }
    return {
      ...toReturn,
      createdAt: territoryObservation.createdAt || null,
      user: territoryObservation.user || {},
      entityKey: territoryObservation.entityKey || '',
    };
  };

  state = {
    territoryObservation: {},
    ...this.castToTerritoryObservation(this.props.route?.params, this.props.context.customFieldsObs),

    territory: this.props.route?.params.territory || {},
    loading: false,
    updating: false,
    editable: this.props.route?.params?.editable || false,
  };
  componentDidMount() {
    this.getTerritoryObservation();
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

  setTerritoryObservation = (structureDB) => {
    const { customFieldsObs } = this.props.context;
    this.setState({
      territoryObservation: Object.assign({}, this.castToTerritoryObservation(structureDB, customFieldsObs), {
        _id: structureDB._id,
      }),
      ...this.castToTerritoryObservation(structureDB, customFieldsObs),
      loading: false,
    });
  };

  getTerritoryObservation = async () => {
    const { route, context } = this.props;
    const { _id } = route.params;
    if (!_id) return;
    this.setTerritoryObservation(context.territoryObservations.find((obs) => obs._id === _id));
  };

  onSaveObservation = async () => {
    this.setState({ updating: true });
    const { territoryObservation } = this.state;
    if (territoryObservation?._id) return this.onUpdateTerritoryObservation();
    return this.onCreateTerritoryObservation();
  };

  onCreateTerritoryObservation = async () => {
    this.setState({ updating: true });
    const { territory } = this.state;
    const { addTerritoryObs, currentTeam, user, customFieldsObs } = this.props.context;
    const response = await addTerritoryObs(
      Object.assign({}, this.castToTerritoryObservation(this.state, customFieldsObs), {
        territory: territory._id,
        user: user._id,
        team: currentTeam._id,
      })
    );
    if (response.code || response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error || response.code);
      return false;
    }
    if (response.ok) {
      Alert.alert('Nouvelle observation créée !');
      this.setTerritoryObservation(response.data);

      this.setState({ updating: false, editable: false });
      return this.onBack();
    }
  };

  onUpdateTerritoryObservation = async () => {
    const { customFieldsObs } = this.props.context;
    this.setState({ updating: true });
    const { territoryObservation } = this.state;
    const response = await this.props.context.updateTerritoryObs(
      Object.assign({}, this.castToTerritoryObservation(this.state, customFieldsObs), {
        _id: territoryObservation._id,
      })
    );
    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      Alert.alert('Observation mise-à-jour !');
      this.setTerritoryObservation(response.data);
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
    const { territoryObservation } = this.state;
    const response = await this.props.context.deleteTerritoryObs(territoryObservation._id);
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Observation supprimée !');
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { territoryObservation } = this.state;
    const { customFieldsObs } = this.props.context;
    const newTerritoryObservation = {
      ...territoryObservation,
      ...this.castToTerritoryObservation(this.state, customFieldsObs),
    };
    if (
      JSON.stringify(this.castToTerritoryObservation(territoryObservation, customFieldsObs)) !==
      JSON.stringify(this.castToTerritoryObservation(newTerritoryObservation, customFieldsObs))
    ) {
      return false;
    }
    return true;
  };

  onBack = () => {
    this.backRequestHandled = true;
    const { navigation } = this.props;
    navigation.goBack();
  };

  onGoBackRequested = () => {
    if (this.isUpdateDisabled()) {
      this.onBack();
      return;
    }
    Alert.alert('Voulez-vous enregistrer cette observation ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await this.onSaveObservation();
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

  _scrollToInput = (ref) => {
    if (!ref) return;
    setTimeout(() => {
      ref.measureLayout(
        findNodeHandle(this.scrollView),
        (x, y, width, height) => {
          this.scrollView.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  render() {
    const { loading, territory, updating, editable, createdAt, territoryObservation } = this.state;
    const { customFieldsObs } = this.props.context;

    return (
      <SceneContainer>
        <ScreenTitle
          title={`${territory?.name} - Observation`}
          onBack={this.onGoBackRequested}
          onEdit={!editable ? this.onEdit : null}
          onSave={!editable ? null : this.onSaveObservation}
          saving={updating}
        />
        <ScrollContainer ref={(r) => (this.scrollView = r)}>
          {loading ? (
            <Spinner />
          ) : (
            <View>
              <CreatedAt>{new Date(createdAt || Date.now()).getLocaleDateAndTime('fr')}</CreatedAt>
              {customFieldsObs
                .filter((f) => f.enabled)
                .map((field) => {
                  const { label, name } = field;
                  return (
                    <CustomFieldInput
                      key={label}
                      label={label}
                      field={field}
                      value={this.state[name]}
                      handleChange={(newValue) => this.setState({ [name]: newValue })}
                      editable={editable}
                      ref={(r) => (this[`${name}-ref`] = r)}
                      onFocus={() => this._scrollToInput(this[`${name}-ref`])}
                    />
                  );
                })}

              <ButtonsContainer>
                {territoryObservation?._id ? (
                  <>
                    <ButtonDelete onPress={this.onDeleteRequest} />
                    <Button
                      caption={editable ? 'Mettre-à-jour' : 'Modifier'}
                      onPress={editable ? this.onSaveObservation : this.onEdit}
                      disabled={editable ? this.isUpdateDisabled() : false}
                      loading={updating}
                    />
                  </>
                ) : (
                  <Button caption="Enregistrer" onPress={this.onSaveObservation} disabled={this.isUpdateDisabled()} loading={updating} />
                )}
              </ButtonsContainer>
            </View>
          )}
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

const CreatedAt = styled(MyText)`
  font-style: italic;
  margin-top: -10px;
  margin-bottom: 20px;
  margin-left: auto;
`;

export default compose(withContext(AuthContext), withContext(TerritoryObservationsContext))(TerritoryObservation);
