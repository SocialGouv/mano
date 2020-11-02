import React from 'react';
import styled from 'styled-components';
import { Alert, Animated, StyleSheet } from 'react-native';
import API from '../../api';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import {
  ListEmptyPersons,
  ListEmptyPlaceWithName,
  ListNoMorePersons,
} from '../../components/ListEmptyContainer';
import colors from '../../utils/colors';
import Search from '../../components/Search';
import needRefresh from '../../utils/needRefresh';
import StickOnTitleContainer from '../../components/StickOnTitleContainer';
import FloatAddButton from '../../components/FloatAddButton';
import Filter from '../../components/Filter/Filter';

const initSearchPlaceholder = 'Rechercher un usager...';

class PersonsList extends React.Component {
  state = {
    persons: [],
    key: 0,
    refreshing: false,
    loading: false,
    page: 0,
    hasMore: true,
    fromSearch: false,
    offset: new Animated.Value(0),
    titleHeight: 0,
    filter: {},
    searchPlaceholder: initSearchPlaceholder,
  };

  componentDidMount() {
    this.getPersons();
    this.props.navigation.addListener('focus', this.handleFocus);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this.handleFocus);
  }

  handleFocus = () => {
    if (needRefresh.PersonsList) {
      delete needRefresh.PersonsList;
      this.onSearchClear();
      this.onRefresh();
    }
  };

  onRefresh = (e) => {
    if (this.state.fromSearch) return;
    this.setState({ refreshing: true, page: 0, hasMore: true }, this.getPersons);
  };

  getPersons = async () => {
    const { hasMore, page, loading, filter } = this.state;
    if (!hasMore || loading || this.gettingPersons) return;
    this.gettingPersons = true;
    this.setState({ loading: true });

    const response = await API.get({ path: '/person', query: { page, ...filter } });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ refreshing: false, loading: false });
    }
    if (response.ok) {
      this.setState(({ key, page, persons }) => ({
        persons: page === 0 ? response.data : [...persons, ...response.data],
        key: key + 1,
        refreshing: false,
        loading: false,
        hasMore: response.hasMore,
        page: page + 1,
      }));
    }
    this.gettingPersons = false;
  };

  onSearchClear = () => {
    this.setState(
      {
        persons: [],
        refreshing: false,
        loading: false,
        page: 0,
        hasMore: true,
        fromSearch: false,
      },
      this.onRefresh
    );
  };
  onSearchStart = () =>
    this.setState({ loading: true, persons: [], fromSearch: true, hasMore: false });
  onSearchComplete = (persons) => {
    this.setState(({ key }) => ({
      persons,
      key: key + 1,
      refreshing: false,
      loading: false,
    }));
  };

  onCreatePersonRequest = () =>
    this.props.navigation.navigate('NewPersonForm', {
      fromRoute: 'PersonsList',
      toRoute: 'Person',
    });

  keyExtractor = (person) => person._id;
  ListFooterComponent = () => {
    const { hasMore, persons } = this.state;
    if (hasMore && persons.length > 0) return <Spinner />;
    if (!persons.length) return null;
    return <ListNoMorePersons />;
  };
  renderPersonRow = ({ item: person }) => {
    const { birthdate, name, _id } = person;
    const { navigate } = this.props.navigation;
    return (
      <PersonRow
        onPress={() => navigate('Person', { _id, name, fromRoute: 'PersonsList' })}
        name={name}
        birthdate={birthdate}
      />
    );
  };

  onTitleLayout = (e) => this.setState({ titleHeight: e.nativeEvent.layout.height });

  render() {
    const {
      persons,
      key,
      refreshing,
      loading,
      fromSearch,
      offset,
      titleHeight,
      filter,
      searchPlaceholder,
    } = this.state;

    return (
      <SceneContainer>
        <ScreenTitle
          title={'USAGERS'}
          backgroundColor={colors.person.backgroundColor}
          color={colors.person.color}
          offset={offset}
          onLayout={this.onTitleLayout}
        />
        <StickOnTitleContainer
          offsetAnimationValue={offset}
          backgroundColor={colors.person.backgroundColor}
          titleHeight={titleHeight}
          style={styles.stickOnTitleContainer}>
          <Search
            results={persons}
            path="/person"
            placeholder={searchPlaceholder}
            onSearchComplete={this.onSearchComplete}
            onSearchStart={this.onSearchStart}
            onSearchClear={this.onSearchClear}
            style={styles.search}
          />
          <Filter
            title="Filtrer par lieu"
            placeholder="Tapez le nom d'un lieu"
            path="/place/autoComplete"
            queryFilter="place"
            ListEmptyComponent={ListEmptyPlaceWithName}
            filterIsOn={Object.keys(filter).length}
            onChange={({ id, name }) => {
              this.setState(
                {
                  filter: { structure: id },
                  searchPlaceholder: `Lieu: ${name} - ${initSearchPlaceholder}`,
                  hasMore: true,
                  page: 0,
                  persons: [],
                },
                () => this.getPersons({ forceSearch: true })
              );
            }}
            onReset={() =>
              this.setState(
                {
                  filter: {},
                  hasMore: true,
                  persons: [],
                  page: 0,
                  searchPlaceholder: initSearchPlaceholder,
                },
                () => this.getPersons({ forceSearch: true })
              )
            }
          />
        </StickOnTitleContainer>

        <Animated.FlatList
          contentContainerStyle={styles.contentContainerStyle}
          onScroll={Animated.event(
            [
              {
                nativeEvent: { contentOffset: { y: this.state.offset } },
              },
            ],
            { useNativeDriver: false /* top not supporter */ }
          )}
          refreshing={refreshing}
          onRefresh={this.onRefresh}
          data={persons}
          extraData={key}
          renderItem={this.renderPersonRow}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={loading ? Spinner : ListEmptyPersons}
          onEndReachedThreshold={fromSearch ? 0 : 0.1}
          onEndReached={this.getPersons}
          ListFooterComponent={this.ListFooterComponent}
        />
        <FloatAddButton
          color={colors.person.backgroundColor}
          onPress={this.onCreatePersonRequest}
        />
      </SceneContainer>
    );
  }
}

const styles = StyleSheet.create({
  contentContainerStyle: { flexGrow: 1, paddingTop: 100 },
  stickOnTitleContainer: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
  search: { flex: 1 },
});

export default PersonsList;
