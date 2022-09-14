import React, { useRef, useState } from 'react';
import { Animated } from 'react-native';
import * as Sentry from '@sentry/react-native';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import { ListEmptyPersons, ListNoMorePersons } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { FlashListStyled } from '../../components/Lists';
import Search from '../../components/Search';
import { personsFullSearchSelector } from '../../recoil/selectors';
import { useRecoilState, useRecoilValue } from 'recoil';
import { loadingState, refreshTriggerState } from '../../components/Loader';

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
    personsFullSearchSelector({
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
  const ListFooterComponent = () => {
    if (!filteredPersons.length) return null;
    return <ListNoMorePersons />;
  };
  const renderPersonRow = ({ item: person }) => {
    const onPress = () => {
      Sentry.setContext('person', { _id: person._id });
      navigation.push('Person', { person, fromRoute: 'PersonsList' });
    };
    return <PersonRow onPress={onPress} person={person} />;
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
      <ScreenTitle title="Personnes suivies" parentScroll={scrollY} customRight={`Filtres (${numberOfFilters})`} onPressRight={onFiltersPress} />
      <Search
        placeholder="Rechercher une personne..."
        onFocus={() => listref?.current?.scrollToOffset({ offset: 100 })}
        parentScroll={scrollY}
        onChange={setSearch}
      />
      <FlashListStyled
        ref={listref}
        withHeaderSearch
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        onScroll={onScroll}
        parentScroll={scrollY}
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
