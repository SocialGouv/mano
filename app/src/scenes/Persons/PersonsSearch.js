import React, { useState } from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import { ListEmptyPersons, ListNoMorePersons } from '../../components/ListEmptyContainer';
import Search from '../../components/Search';
import FlatListStyled from '../../components/FlatListStyled';
import { useRecoilState, useRecoilValue } from 'recoil';
import { personsSearchSelector } from '../../recoil/selectors';
import { loadingState, refreshTriggerState } from '../../components/Loader';

const PersonsSearch = ({ navigation, route }) => {
  const [search, setSearch] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const loading = useRecoilState(loadingState);

  const filteredPersons = useRecoilValue(personsSearchSelector({ search }));

  const onRefresh = async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  };

  const onCreatePersonRequest = () => {
    navigation.push('NewPersonForm', {
      fromRoute: route.params.fromRoute,
      toRoute: route.params.fromRoute,
    });
  };

  const onSelectPerson = (person) => {
    navigation.navigate(route.params.fromRoute, {
      person: person?._id,
    });
  };

  const onBack = async () => {
    navigation.navigate(route.params.fromRoute);
  };

  const keyExtractor = (person) => person._id;
  const ListFooterComponent = () => {
    if (!filteredPersons.length) return null;
    return <ListNoMorePersons />;
  };
  const renderPersonRow = ({ item: person }) => <PersonRow onPress={() => onSelectPerson(person)} person={person} buttonRight="+" />;

  return (
    <SceneContainer>
      <ScreenTitle title="Choisissez une personne" onBack={onBack} onAdd={onCreatePersonRequest} />
      <Search placeholder="Rechercher une personne..." onChange={setSearch} />
      <FlatListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        data={filteredPersons}
        extraData={filteredPersons}
        renderItem={renderPersonRow}
        keyExtractor={keyExtractor}
        initialNumToRender={10}
        ListEmptyComponent={loading ? Spinner : ListEmptyPersons}
        ListFooterComponent={ListFooterComponent}
      />
    </SceneContainer>
  );
};

export default PersonsSearch;
