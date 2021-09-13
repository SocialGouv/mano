import React from 'react';
import styled from 'styled-components';
import { Alert, Linking } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../services/api';
import Spinner from '../../components/Spinner';
import { getCityFromPostCode } from '../../services/postCode';
import ButtonsContainer from '../../components/ButtonsContainer';
import colors from '../../utils/colors';
import ButtonDelete from '../../components/ButtonDelete';
import Label from '../../components/Label';
import Tags from '../../components/Tags';
import Spacer from '../../components/Spacer';
import PinIcon from '../../icons/PinIcon';
import PhoneIcon from '../../icons/PhoneIcon';
import StructuresContext from '../../contexts/structures';
import withContext from '../../contexts/withContext';

const isEven = (value) => {
  if (value % 2 === 0) return true;
  return false;
};

class Structure extends React.Component {
  castToStructure = (structure = {}) => ({
    name: structure.name?.trim() || '',
    adresse: structure.adresse?.trim() || '',
    postcode: structure.postcode?.trim() || '',
    city: structure.city?.trim() || '',
    description: structure.description?.trim() || '',
    phone: structure.phone?.trim() || '',
    categories: structure.categories?.length ? structure.categories : [],
  });

  state = {
    structure: {},
    ...this.castToStructure(this.props.route?.params),

    loading: false,
    updating: false,
    editable: this.props.route?.params?.editable || false,
    cagetoriesUpdated: false,
  };

  componentDidMount() {
    this.getStructure();
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

  setStructure = (structureDB) => {
    this.setState({
      structure: Object.assign({}, this.castToStructure(structureDB), { _id: structureDB._id }),
      ...this.castToStructure(structureDB),
      loading: false,
    });
  };

  getStructure = async () => {
    const { _id } = this.props.route.params;
    const response = await API.get({ path: `/structure/${_id}` });
    if (response.error) return Alert.alert(response.error);
    this.setStructure(response.data);
  };

  setPostCode = async (postcode) => {
    this.setState({ postcode });
    if (postcode.length === 5) {
      const response = await getCityFromPostCode(postcode);
      if (response.ok) {
        this.setState({ city: response.city });
      }
    }
  };

  setPhone = (phone) => {
    if (!phone.startsWith('0')) return this.setState({ phone });
    const phoneNumber = this.state.phone;
    if (phone.length < phoneNumber.length) {
      if (phoneNumber.endsWith(' ')) {
        this.setState({ phone: phone.slice(0, -1) });
      } else {
        this.setState({ phone });
      }
      return;
    }
    const noSpacePhone = phone.split(' ').join('');

    if (noSpacePhone.length >= 10) return this.setState({ phone });
    if (isEven(noSpacePhone.length)) {
      this.setState({ phone: `${phone} ` });
    } else {
      this.setState({ phone });
    }
  };

  onCall = () => {
    Linking.openURL('tel:' + this.state.phone.split(' ').join(''));
  };

  onUpdateStructure = async () => {
    this.setState({ updating: true });
    const { structure } = this.state;
    const response = await API.put({
      path: `/structure/${structure._id}`,
      body: this.castToStructure(this.state),
    });
    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      Alert.alert('Structure mise-à-jour !');
      this.setStructure(response.data);
      this.props.context.updateStructure(response.data);
      this.setState({ updating: false, editable: false });
      return true;
    }
  };

  onDeleteRequest = () => {
    Alert.alert('Voulez-vous vraiment supprimer cette structure ?', 'Cette opération est irréversible.', [
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
    const { structure } = this.state;
    const response = await API.delete({ path: `/structure/${structure._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Structure supprimée !');
      this.props.context.deleteStructure(structure._id);
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { structure, cagetoriesUpdated } = this.state;
    const newStructure = { ...structure, ...this.castToStructure(this.state) };
    if (cagetoriesUpdated) return false;
    if (JSON.stringify(structure) !== JSON.stringify(newStructure)) return false;
    return true;
  };

  formatGoogleMapUrl = () => {
    const { adresse, city, postcode } = this.state;
    const query = `${adresse.trim()} ${postcode ? postcode.trim() + ' ' : ' '}${city.trim()}`.split(' ').join('+');
    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${query}`;
  };
  onShowMap = () => {
    Linking.openURL(this.formatGoogleMapUrl());
  };

  showMapButton = () => {
    const { adresse, city } = this.state;
    if (!adresse) return false;
    if (!city) return false;
    return Linking.canOpenURL(this.formatGoogleMapUrl());
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
    Alert.alert('Voulez-vous enregistrer cette structure ?', null, [
      {
        text: 'Enregistrer',
        onPress: async () => {
          const ok = await this.onUpdateStructure();
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
    const { loading, name, description, categories, city, postcode, adresse, phone, updating, editable } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle
          title={name}
          onBack={this.onGoBackRequested}
          onEdit={!editable ? this.onEdit : null}
          onSave={!editable ? null : this.onUpdateStructure}
          saving={updating}
        />
        <ScrollContainer>
          {loading ? (
            <Spinner />
          ) : (
            <>
              <InputLabelled
                label="Nom"
                onChangeText={(name) => this.setState({ name })}
                value={name}
                placeholder="Nom"
                textContentType="organizationName"
                editable={editable}
              />
              <InputLabelled
                label="Adresse"
                onChangeText={(adresse) => this.setState({ adresse })}
                value={adresse}
                placeholder="Bâtiment B\n2, rue de la République"
                multiline
                autoCorrect={false}
                textContentType="fullStreetAddress"
                editable={editable}
              />
              <InputLabelled
                label="Code postal"
                onChangeText={this.setPostCode}
                value={postcode}
                placeholder="75018"
                textContentType="postalCode"
                keyboardType="numeric"
                maxLength={5}
                editable={editable}
              />
              <InputLabelled
                label="Ville"
                onChangeText={(city) => this.setState({ city })}
                value={city}
                placeholder="Paris"
                autoCapitalize="characters"
                textContentType="addressCity"
                autoCorrect={false}
                editable={editable}
              />
              {!editable && this.showMapButton() && <Spacer />}
              {this.showMapButton() && (
                <ButtonsContainer>
                  <Button caption="Afficher dans Google Maps" Icon={PinIcon} color={colors.app.secondary} onPress={this.onShowMap} fullWidth />
                </ButtonsContainer>
              )}
              {!editable && this.showMapButton() && <Spacer />}
              <Row>
                <InputLabelled
                  label="Téléphone"
                  onChangeText={this.setPhone}
                  value={phone}
                  placeholder="06 12 52 32 13"
                  textContentType="telephoneNumber"
                  keyboardType="number-pad"
                  autoCorrect={false}
                  editable={editable}
                  noMargin={editable || phone?.length}
                />
                <Spacer />
                {!!phone.length && <Button caption="Appeler" Icon={PhoneIcon} color={colors.app.secondary} onPress={this.onCall} noBorder />}
              </Row>
              <InputLabelled
                label="Description"
                onChangeText={(description) => this.setState({ description })}
                value={description}
                placeholder="Description"
                multiline
                editable={editable}
              />
              <Label label="Catégories" big={!editable} />
              <Tags data={categories} onChange={(categories) => this.setState({ categories, cagetoriesUpdated: true })} editable={editable} />
              <ButtonsContainer>
                <ButtonDelete onPress={this.onDeleteRequest} />
                <Button
                  caption={editable ? 'Mettre-à-jour' : 'Modifier'}
                  onPress={editable ? this.onUpdateStructure : this.onEdit}
                  disabled={editable ? this.isUpdateDisabled() : false}
                  loading={updating}
                />
              </ButtonsContainer>
            </>
          )}
        </ScrollContainer>
      </SceneContainer>
    );
  }
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 30px;
`;

export default withContext(StructuresContext)(Structure);
