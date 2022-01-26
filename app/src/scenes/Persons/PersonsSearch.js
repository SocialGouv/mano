import React, { useState } from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import PersonRow from './PersonRow';
import Spinner from '../../components/Spinner';
import { ListEmptyPersons, ListNoMorePersons } from '../../components/ListEmptyContainer';
import Search from '../../components/Search';
import FlatListStyled from '../../components/FlatListStyled';
import { useRefresh } from '../../recoil/refresh';
import { useRecoilValue } from 'recoil';
import { personsFullSearchSelector } from '../../recoil/selectors';

const PersonsSearch = ({ navigation, route }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { loading, personsRefresher } = useRefresh();

  const filteredPersons = useRecoilValue(personsFullSearchSelector({ search }));

  const onRefresh = async () => {
    setRefreshing(true);
    await personsRefresher();
    setRefreshing(false);
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
        refreshing={refreshing}
        onRefresh={onRefresh}
        data={filteredPersons}
        extraData={filteredPersons}
        renderItem={renderPersonRow}
        keyExtractor={keyExtractor}
        ListEmptyComponent={loading ? Spinner : ListEmptyPersons}
        ListFooterComponent={ListFooterComponent}
      />
    </SceneContainer>
  );
};

export default PersonsSearch;
