import React from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import { ListEmptyPersons, ListNoMorePersons } from '../../components/ListEmptyContainer';
import Search from '../../components/Search';
import FlatListStyled from '../../components/FlatListStyled';
import withContext from '../../contexts/withContext';
import AuthContext from '../../contexts/auth';
import { compose } from 'recompose';
import PersonsContext from '../../contexts/persons';
import RefreshContext from '../../contexts/refresh';
import { capture } from '../../services/sentry';

class PersonsSearch extends React.Component {
  state = {
    refreshing: false,
    search: '',
  };

  person = null;

  onRefresh = () => {
    this.setState({ refreshing: true }, this.refreshData);
  };

  refreshData = async () => {
    await this.props.context.refreshPersons();
    this.setState({ loading: false, refreshing: false });
  };

  onCreatePersonRequest = () => {
    const { route, navigation } = this.props;
    navigation.push('NewPersonForm', {
      fromRoute: route.params.fromRoute,
      toRoute: route.params.fromRoute,
    });
  };

  onSelectPerson = (person) => {
    this.person = person;
    this.onBack();
  };

  onBack = async () => {
    const { navigation, route } = this.props;
    if (!this.person?._id) {
      await new Promise((res) => setTimeout(res, 500));
    }
    if (!this.person?._id) {
      capture('error navigating to person', { extra: this.state });
    }
    navigation.navigate(route.params.fromRoute, {
      person: this.person?._id,
    });
  };

  keyExtractor = (person) => person._id;
  ListFooterComponent = () => {
    const { persons } = this.props.context;
    if (!persons.length) return null;
    return <ListNoMorePersons />;
  };
  renderPersonRow = ({ item: person }) => <PersonRow onPress={() => this.onSelectPerson(person)} person={person} buttonRight="+" />;

  render() {
    const { key, refreshing, loading, search } = this.state;
    const { persons } = this.props.context;
    const data = persons.filter((p) => p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    return (
      <SceneContainer>
        <ScreenTitle title="Choisissez une personne" onBack={this.onBack} onAdd={this.onCreatePersonRequest} />
        <Search placeholder="Rechercher une personne..." onChange={(search) => this.setState({ search })} />
        <FlatListStyled
          refreshing={refreshing}
          onRefresh={this.onRefresh}
          data={data}
          extraData={key}
          renderItem={this.renderPersonRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyPersons}
          ListFooterComponent={this.ListFooterComponent}
        />
      </SceneContainer>
    );
  }
}

export default compose(withContext(AuthContext), withContext(PersonsContext), withContext(RefreshContext))(PersonsSearch);
