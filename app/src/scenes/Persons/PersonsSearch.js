import React from 'react';
import styled from 'styled-components';
import { Alert } from 'react-native';
import API from '../../api';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import { ListEmptyPersons } from '../../components/ListEmptyContainer';
import colors from '../../utils/colors';
import Search from '../../components/Search';

const noPerson = {
  _id: '1',
  name: '-- Aucun --',
};

class PersonsSearch extends React.Component {
  state = {
    persons: [],
    key: 0,
    refreshing: false,
    loading: true,
    search: '',
  };

  person = null;

  componentDidMount() {
    this.getPersons(false);
  }

  getPersons = async (refresh = true) => {
    if (refresh) {
      this.setState({ refreshing: true });
    }
    const response = await API.get({ path: '/person' });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ refreshing: false, loading: false });
    }
    if (response.ok) {
      this.setState(({ key }) => ({
        persons: [noPerson, ...response.data],
        key: key + 1,
        refreshing: false,
        loading: false,
      }));
    }
  };

  onCreatePersonRequest = () => {
    const { route, navigation } = this.props;
    navigation.navigate('NewPersonForm', {
      fromRoute: route.params.fromRoute,
      toRoute: route.params.fromRoute,
    });
  };

  onSearchStart = () => this.setState({ loading: true, persons: [] });
  onSearchComplete = (persons) => {
    this.setState(({ key }) => ({
      persons: [noPerson, ...persons],
      key: key + 1,
      refreshing: false,
      loading: false,
    }));
  };

  onSelectPerson = (person) => {
    this.person = person;
    this.onBack();
  };

  onBack = () => {
    const { navigation, route } = this.props;
    navigation.navigate(route.params.fromRoute, {
      person: this.person,
    });
  };

  keyExtractor = (person) => person._id;
  renderUserRow = ({ item: person }) => {
    const { birthdate, name } = person;
    return (
      <PersonRow
        onPress={() => this.onSelectPerson(person)}
        name={name}
        birthdate={birthdate}
        buttonRight="+"
      />
    );
  };

  render() {
    const { persons, key, refreshing, loading } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle
          title="Choisissez un usager"
          onBack={this.onBack}
          backgroundColor={colors.person.backgroundColor}
          color={colors.person.color}
          onAdd={this.onCreatePersonRequest}
        />
        <Search
          results={persons}
          path="/person"
          placeholder="Rechercher un usager..."
          onSearchComplete={this.onSearchComplete}
          onSearchStart={this.onSearchStart}
        />
        <FlatListStyled
          refreshing={refreshing}
          onRefresh={this.getPersons}
          data={persons}
          extraData={key}
          renderItem={this.renderUserRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyPersons}
        />
      </SceneContainer>
    );
  }
}

const FlatListStyled = styled.FlatList.attrs({
  contentContainerStyle: { flexGrow: 1 },
})`
  flex: 1;
`;

export default PersonsSearch;
