import React from 'react';
import styled from 'styled-components';
import { Alert, Linking } from 'react-native';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import InputLabelled from '../../components/InputLabelled';
import Button from '../../components/Button';
import API from '../../api';
import Spinner from '../../components/Spinner';
import { getCityFromPostCode } from '../../services/postCode';
import ButtonsContainer from '../../components/ButtonsContainer';
import colors from '../../utils/colors';
import ButtonDelete from '../../components/ButtonDelete';
import needRefresh from '../../utils/needRefresh';

const isEven = (value) => {
  if (value % 2 === 0) return true;
  return false;
};

class Structure extends React.Component {
  state = {
    structure: {},
    name: this.props.route?.params?.name || '',
    adresse: '',
    city: '',
    postcode: '',
    phone: '',
    description: '',
    categories: '',
    loading: true,
    updating: false,
  };

  async componentDidMount() {
    await this.getStructure();
  }

  setStructure = (structureDB) => {
    const { name, description, categories, city, postcode, phone, adresse, _id } = structureDB;
    const structure = {
      name: name || '',
      adresse: adresse || '',
      postcode: postcode || '',
      city: city || '',
      description: description || '',
      phone: phone || '',
      categories: categories?.length ? categories.join(' ') : '',
    };
    this.setState({
      structure: Object.assign({}, structure, { _id }),
      ...structure,
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
    const { name, description, categories, city, postcode, adresse, structure, phone } = this.state;
    const response = await API.put({
      path: `/structure/${structure._id}`,
      body: {
        name: name.trim(),
        adresse: adresse.trim(),
        postcode: postcode.trim(),
        city: city.trim(),
        description: description.trim(),
        phone: phone.trim(),
        categories: categories.split(' '),
      },
    });
    if (response.error) {
      this.setState({ updating: false });
      Alert.alert(response.error);
      return false;
    }
    if (response.ok) {
      Alert.alert('Structure mise-à-jour !');
      this.setNeedRefresh();
      this.setStructure(response.data);
      this.setState({ updating: false });
      return true;
    }
  };

  onDeleteRequest = () => {
    Alert.alert(
      'Voulez-vous vraiment supprimer cette structure ?',
      'Cette opération est irréversible.',
      [
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: this.onDelete,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  onDelete = async () => {
    const { structure } = this.state;
    const response = await API.delete({ path: `/structure/${structure._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      Alert.alert('Structure supprimée !');
      this.setNeedRefresh();
      this.onBack();
    }
  };

  isUpdateDisabled = () => {
    const { name, description, categories, city, postcode, adresse, phone, structure } = this.state;
    if (structure.name !== name) return false;
    if (structure.adresse !== adresse) return false;
    if (structure.postcode !== postcode) return false;
    if (structure.city !== city) return false;
    if (structure.description !== description) return false;
    if (structure.phone !== phone) return false;
    if (structure.categories !== categories) return false;
    return true;
  };

  formatGoogleMapUrl = () => {
    const { adresse, city, postcode } = this.state;
    const query = `${adresse.trim()} ${postcode ? postcode.trim() + ' ' : ' '}${city.trim()}`
      .split(' ')
      .join('+');
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

  setNeedRefresh = () => {
    needRefresh.StructuresList = true;
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
    const {
      loading,
      name,
      description,
      categories,
      city,
      postcode,
      adresse,
      phone,
      updating,
    } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle
          title={name}
          onBack={this.onGoBackRequested}
          backgroundColor={colors.structure.backgroundColor}
          color={colors.structure.color}
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
              />
              <InputLabelled
                label="Adresse"
                onChangeText={(adresse) => this.setState({ adresse })}
                value={adresse}
                placeholder={'Bâtiment B\n2, rue de la République'}
                multiline
                autoCorrect={false}
                textContentType="fullStreetAddress"
              />
              <InputLabelled
                label="Code postal"
                onChangeText={this.setPostCode}
                value={postcode}
                placeholder="75018"
                textContentType="postalCode"
                keyboardType="numeric"
                maxLength={5}
              />
              <InputLabelled
                label="Ville"
                onChangeText={(city) => this.setState({ city })}
                value={city}
                placeholder="Paris"
                autoCapitalize="characters"
                textContentType="addressCity"
                autoCorrect={false}
              />
              {this.showMapButton() && (
                <ButtonsContainer>
                  <Button
                    caption="Afficher dans Google Maps"
                    backgroundColor={colors.structure.backgroundColor}
                    color={colors.structure.color}
                    onPress={this.onShowMap}
                  />
                </ButtonsContainer>
              )}
              <Row>
                <InputLabelled
                  label="Téléphone"
                  onChangeText={this.setPhone}
                  value={phone}
                  placeholder="06 12 52 32 13"
                  textContentType="telephoneNumber"
                  keyboardType="number-pad"
                  autoCorrect={false}
                />
                <Spacer />
                <Button
                  caption="Appeler"
                  backgroundColor={colors.structure.backgroundColor}
                  color={colors.structure.color}
                  onPress={this.onCall}
                />
              </Row>
              <InputLabelled
                label="Description"
                onChangeText={(description) => this.setState({ description })}
                value={description}
                placeholder="Description"
                multiline
              />
              <InputLabelled
                label="Catégories"
                onChangeText={(categories) => this.setState({ categories })}
                value={categories}
                placeholder="Séparez les catégories par des espaces"
                multiline
              />
              <ButtonsContainer>
                <ButtonDelete onPress={this.onDeleteRequest} />
                <Button
                  caption="Mettre-à-jour"
                  backgroundColor={colors.structure.backgroundColor}
                  color={colors.structure.color}
                  onPress={this.onUpdateStructure}
                  disabled={this.isUpdateDisabled()}
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
`;

const Spacer = styled.View`
  width: 30px;
  flex-shrink: 0;
`;

export default Structure;
