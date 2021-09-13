import React from 'react';
import { Alert, findNodeHandle, View } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import Button from '../../components/Button';
import API from '../../services/api';
import Spinner from '../../components/Spinner';
import ButtonsContainer from '../../components/ButtonsContainer';
import ButtonDelete from '../../components/ButtonDelete';
import InputLabelled from '../../components/InputLabelled';
import YesNoSelect from '../../components/Selects/YesNoSelect';
import AtmosphereSelect from '../../components/Selects/AtmosphereSelect';
import styled from 'styled-components';
import { MyText } from '../../components/MyText';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import { compose } from 'recompose';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import TerritoryObservationsContext from '../../contexts/territoryObservations';

class TerritoryObservation extends React.Component {
  castToTerritoryObservation = (territoryObservation = {}) => ({
    personsMale: territoryObservation.personsMale?.trim() || '',
    personsFemale: territoryObservation.personsFemale?.trim() || '',
    police: territoryObservation.police?.trim() || '',
    material: territoryObservation.material?.trim() || '',
    atmosphere: territoryObservation.atmosphere?.trim() || '',
    mediation: territoryObservation.mediation?.trim() || '',
    comment: territoryObservation.comment?.trim() || '',
    createdAt: territoryObservation.createdAt || null,
    user: territoryObservation.user || {},
    entityKey: territoryObservation.entityKey || '',
  });

  state = {
    territoryObservation: {},
    ...this.castToTerritoryObservation(this.props.route?.params),

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
    this.setState({
      territoryObservation: Object.assign({}, this.castToTerritoryObservation(structureDB), {
        _id: structureDB._id,
      }),
      ...this.castToTerritoryObservation(structureDB),
      loading: false,
    });
  };

  getTerritoryObservation = async () => {
    const { _id } = this.props.route.params;
    if (!_id) return;
    this.setTerritoryObservation(this.props.context.territoryObservations.find((obs) => obs._id === _id));
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
    const { addTerritoryObs, currentTeam } = this.props.context;
    const response = await addTerritoryObs(
      Object.assign({}, this.castToTerritoryObservation(this.state), {
        territory: territory._id,
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
    this.setState({ updating: true });
    const { territoryObservation } = this.state;
    const response = await this.props.context.updateTerritoryObs(
      Object.assign({}, this.castToTerritoryObservation(this.state), {
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
    const newTerritoryObservation = {
      ...territoryObservation,
      ...this.castToTerritoryObservation(this.state),
    };
    if (
      JSON.stringify(this.castToTerritoryObservation(territoryObservation)) !==
      JSON.stringify(this.castToTerritoryObservation(newTerritoryObservation))
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
    const {
      loading,
      territory,
      updating,
      editable,
      personsMale,
      personsFemale,
      police,
      material,
      atmosphere,
      mediation,
      createdAt,
      comment,
      territoryObservation,
    } = this.state;

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
              <InputLabelled
                label="Nombre de personnes non connues hommes rencontrées"
                onChangeText={(personsMale) => this.setState({ personsMale })}
                value={personsMale}
                placeholder="Nombre de personnes non connues rencontrées"
                keyboardType="number-pad"
                editable={editable}
                ref={(r) => (this.personsMaleRef = r)}
                onFocus={() => this._scrollToInput(this.personsMaleRef)}
              />
              <InputLabelled
                label="Nombre de personnes non connues femmes - rencontrées"
                onChangeText={(personsFemale) => this.setState({ personsFemale })}
                value={personsFemale}
                placeholder="Nombre de personnes non connues femmes rencontrées"
                keyboardType="number-pad"
                editable={editable}
                ref={(r) => (this.personsFemaleRef = r)}
                onFocus={() => this._scrollToInput(this.personsFemaleRef)}
              />
              <YesNoSelect label="Présence policière" value={police} onSelect={(police) => this.setState({ police })} editable={editable} />
              <InputLabelled
                label="Nombre de matériel ramassé"
                onChangeText={(material) => this.setState({ material })}
                value={material}
                placeholder="Nombre de matériel ramassé"
                keyboardType="number-pad"
                editable={editable}
                ref={(r) => (this.materialRef = r)}
                onFocus={() => this._scrollToInput(this.materialRef)}
              />
              <AtmosphereSelect value={atmosphere} onSelect={(atmosphere) => this.setState({ atmosphere })} editable={editable} />
              <InputLabelled
                label="Nombre de médiations avec les riverains / les structures"
                onChangeText={(mediation) => this.setState({ mediation })}
                value={mediation}
                placeholder="Nombre de médiations avec les riverains / les structures"
                keyboardType="number-pad"
                editable={editable}
                ref={(r) => (this.mediationRef = r)}
                onFocus={() => this._scrollToInput(this.mediationRef)}
              />
              <InputLabelled
                label="Commentaire"
                onChangeText={(comment) => this.setState({ comment })}
                value={comment}
                placeholder="Commentaire"
                multiline
                ref={(r) => (this.commentRef = r)}
                onFocus={() => this._scrollToInput(this.commentRef)}
              />
              <DateAndTimeInput
                label="Observation faite le"
                setDate={(createdAt) => this.setState({ createdAt })}
                date={createdAt}
                showTime
                showDay
                withTime
                editable
                required
              />
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
