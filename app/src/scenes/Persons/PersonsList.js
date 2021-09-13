import React from 'react';
import { Animated } from 'react-native';
import { compose } from 'recompose';
import * as Sentry from '@sentry/react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import { ListEmptyPersons, ListNoMorePersons } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import FlatListStyled from '../../components/FlatListStyled';
import Search from '../../components/Search';
import withContext from '../../contexts/withContext';
import PersonsContext from '../../contexts/persons';
import RefreshContext from '../../contexts/refresh';

class PersonsList extends React.Component {
  state = {
    refreshing: false,
    search: '',
  };

  onRefresh = () => {
    this.setState({ refreshing: true }, this.refreshData);
  };

  refreshData = async () => {
    await this.props.context.refreshPersons();
    this.setState({ loading: false, refreshing: false });
  };

  onCreatePersonRequest = () =>
    this.props.navigation.navigate('NewPersonForm', {
      fromRoute: 'PersonsList',
      toRoute: 'Person',
    });

  onFiltersPress = () => this.props.navigation.push('PersonsFilter', this.props.route.params);

  keyExtractor = (person) => person._id;
  ListFooterComponent = () => {
    const { persons } = this.props.context;
    if (!persons.length) return null;
    return <ListNoMorePersons />;
  };
  renderPersonRow = ({ item: person }) => {
    const onPress = () => {
      Sentry.setContext('person', { _id: person._id });
      this.props.navigation.push('Person', { ...person, fromRoute: 'PersonsList' });
    };
    return <PersonRow onPress={onPress} person={person} />;
  };

  scrollY = new Animated.Value(0);
  onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: this.scrollY,
          },
        },
      },
    ],
    { useNativeDriver: true }
  );

  filterPersons = (persons) => {
    const { search } = this.state;
    const params = this.props.route?.params?.filters || {};
    const filterTeams = params?.filterTeams || [];
    const filterAlertness = params?.filterAlertness || false;

    if (filterAlertness) persons = persons.filter((p) => Boolean(p.alertness));
    if (search?.length) {
      persons = persons.filter((p) => p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    }
    if (filterTeams.length) {
      persons = persons.filter((p) => {
        for (let assignedTeam of p.assignedTeams) {
          if (filterTeams.includes(assignedTeam)) return true;
        }
        return false;
      });
    }
    return persons;
  };

  render() {
    const { refreshing, loading } = this.state;
    const { persons, personKey } = this.props.context;
    const params = this.props.route?.params?.filters || {};
    const filterTeams = params?.filterTeams || [];
    const filterAlertness = params?.filterAlertness || false;
    const numberOfFilters = Number(Boolean(filterAlertness)) + filterTeams.length;

    const data = this.filterPersons(persons);

    return (
      <SceneContainer>
        <ScreenTitle
          title="Personnes suivies"
          parentScroll={this.scrollY}
          customRight={`Filtres (${numberOfFilters})`}
          onPressRight={this.onFiltersPress}
        />
        <Search
          placeholder="Rechercher une personne..."
          onFocus={() => this.listRef.scrollToOffset({ offset: 100 })}
          parentScroll={this.scrollY}
          onChange={(search) => this.setState({ search })}
        />
        <FlatListStyled
          ref={(r) => (this.listRef = r)}
          refreshing={refreshing}
          onRefresh={this.onRefresh}
          onScroll={this.onScroll}
          parentScroll={this.scrollY}
          data={data}
          extraData={personKey}
          renderItem={this.renderPersonRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyPersons}
          initialNumToRender={10}
          ListFooterComponent={this.ListFooterComponent}
          defaultTop={0}
        />
        <FloatAddButton onPress={this.onCreatePersonRequest} />
      </SceneContainer>
    );
  }
}

export default compose(withContext(PersonsContext), withContext(RefreshContext))(PersonsList);
