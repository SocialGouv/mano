import React, { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import { ListEmptyPersons, ListNoMorePersons } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { FlashListStyled } from '../../components/Lists';
import Search from '../../components/Search';
import { arrayOfitemsGroupedByPersonSelector, itemsGroupedByPersonSelector } from '../../recoil/selectors';
import { selector, selectorFamily, useRecoilState, useRecoilValue } from 'recoil';
import { loadingState, refreshTriggerState } from '../../components/Loader';
import { filterBySearch } from '../../utils/search';
import colors from '../../utils/colors';

const personsFilteredSelector = selectorFamily({
  key: 'personsFilteredSelector',
  get:
    ({ filterTeams, filterOutOfActiveList, filterAlertness }) =>
    ({ get }) => {
      const persons = get(arrayOfitemsGroupedByPersonSelector);
      let personsFiltered = persons;
      if (filterOutOfActiveList) {
        personsFiltered = personsFiltered.filter((p) => (filterOutOfActiveList === 'Oui' ? p.outOfActiveList : !p.outOfActiveList));
      }
      if (filterAlertness) personsFiltered = personsFiltered.filter((p) => !!p.alertness);
      if (filterTeams.length) {
        personsFiltered = personsFiltered.filter((p) => {
          const assignedTeams = p.assignedTeams || [];
          for (let assignedTeam of assignedTeams) {
            if (filterTeams.includes(assignedTeam)) return true;
          }
          return false;
        });
      }
      return personsFiltered;
    },
});

const personsFilteredBySearchSelector = selectorFamily({
  key: 'personsFilteredBySearchSelector',
  get:
    ({ filterTeams, filterOutOfActiveList, filterAlertness, search }) =>
    ({ get }) => {
      if (!search?.length && !filterTeams.length && !filterOutOfActiveList && !filterAlertness) {
        const persons = get(arrayOfitemsGroupedByPersonSelector);
        return persons;
      }

      const personsFiltered = get(personsFilteredSelector({ filterTeams, filterAlertness, filterOutOfActiveList }));

      const personsfilteredBySearch = filterBySearch(search, personsFiltered);

      return personsfilteredBySearch;
    },
});

const PersonsList = ({ navigation, route }) => {
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const loading = useRecoilValue(loadingState);
  const params = route?.params?.filters || {};

  const filterTeams = params?.filterTeams || [];
  const filterAlertness = params?.filterAlertness || false;
  const filterOutOfActiveList = params?.filterOutOfActiveList || '';
  const numberOfFilters = Number(Boolean(filterAlertness)) + filterTeams.length + Number(['Oui', 'Non'].includes(filterOutOfActiveList));

  const filteredPersons = useRecoilValue(
    personsFilteredBySearchSelector({
      search,
      filterTeams,
      filterAlertness,
      filterOutOfActiveList,
    })
  );

  const onRefresh = async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  };

  const onCreatePersonRequest = () => navigation.navigate('NewPersonForm', { toRoute: 'Person' });

  const onFiltersPress = () => navigation.push('PersonsFilter', route.params);

  const keyExtractor = (person) => person._id;
  const ListFooterComponent = useCallback(() => {
    if (!filteredPersons.length) return null;
    return <ListNoMorePersons />;
  }, [filteredPersons.length]);
  const renderPersonRow = ({ item: person }) => {
    const onPress = () => {
      Sentry.setContext('person', { _id: person._id });
      navigation.push('Person', { person, fromRoute: 'PersonsList' });
    };
    const { birthdate, name, _id } = person;
    return <PersonRow onPress={onPress} birthdate={birthdate} name={name} _id={_id} />;
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: scrollY,
          },
        },
      },
    ],
    { useNativeDriver: true }
  );

  const listref = useRef(null);

  return (
    <SceneContainer>
      <ScreenTitle title={'USAGERS'} offset={scrollY} backgroundColor={colors.person.backgroundColor} color={colors.person.color} />
      <Animated.FlatList
        contentContainerStyle={styles.contentContainerStyle}
        ref={listref}
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        onScroll={Animated.event(
          [
            {
              nativeEvent: { contentOffset: { y: scrollY } },
            },
          ],
          { useNativeDriver: false /* top not supporter */ }
        )}
        data={filteredPersons}
        extraData={filteredPersons}
        estimatedItemSize={114}
        renderItem={renderPersonRow}
        keyExtractor={keyExtractor}
        ListEmptyComponent={loading ? Spinner : ListEmptyPersons}
        initialNumToRender={10}
        ListFooterComponent={ListFooterComponent}
        defaultTop={0}
      />
      <FloatAddButton onPress={onCreatePersonRequest} testID="add-person-button" />
    </SceneContainer>
  );
};

export default PersonsList;

const styles = StyleSheet.create({
  contentContainerStyle: { flexGrow: 1, paddingTop: 100 },
  stickOnTitleContainer: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
  search: { flex: 1 },
});
