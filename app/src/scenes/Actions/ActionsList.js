import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import { useRecoilValue } from 'recoil';
import SceneContainer from '../../components/SceneContainer';
import ActionRow from './ActionRow';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { MyText } from '../../components/MyText';
import FlatListStyled, { SectionListStyled } from '../../components/FlatListStyled';
import { isComingInDays, isPassed, isToday, isTomorrow } from '../../services/date';
import { DONE, TODO, CANCEL } from '../../recoil/actions';
import API from '../../services/api';
import { useRefresh } from '../../recoil/refresh';
import { actionsByStatusSelector } from '../../recoil/selectors';
import { personsState } from '../../recoil/persons';
import { useNavigation } from '@react-navigation/native';

const PASSED = 'Passées';
const TODAY = "Aujourd'hui";
const TOMORROW = 'Demain';
const INCOMINGDAYS = 'À venir';
const sections = [
  {
    title: PASSED,
    data: [],
  },
  {
    title: TODAY,
    data: [],
  },
  {
    title: TOMORROW,
    data: [],
  },
  {
    title: INCOMINGDAYS,
    data: [],
  },
];

const formatData = (data, status) => {
  if (!data?.length) return null;
  if ([DONE, CANCEL].includes(status)) return data;
  console.log(status, data.length);
  const dataInSections = data.reduce((actions, action) => {
    let inSection = null;
    if (isPassed(action.dueAt)) inSection = PASSED;
    if (isToday(action.dueAt)) inSection = TODAY;
    if (isTomorrow(action.dueAt)) inSection = TOMORROW;
    if (isComingInDays(action.dueAt, 2)) inSection = INCOMINGDAYS;
    return actions.map((section) => {
      if (section.title !== inSection) return section;
      return { ...section, data: [...section.data, action] };
    });
  }, sections);
  return dataInSections;
};

const ActionsList = ({ status, onScroll, parentScroll }) => {
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const { loading, actionsRefresher } = useRefresh();
  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status }));
  const persons = useRecoilValue(personsState);

  useEffect(() => {
    API.navigation = navigation;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await actionsRefresher();
    setRefreshing(false);
  };

  const onCreateAction = () => navigation.navigate('NewActionForm', { fromRoute: 'ActionsList' });

  const renderSectionHeader = ({ section: { title } }) => <SectionHeader heavy>{title}</SectionHeader>;

  const keyExtractor = (action) => action._id;
  const ListFooterComponent = () => {
    if (!actionsByStatus.length) return null;
    return <ListNoMoreActions />;
  };
  const onActionPress = (action) => {
    Sentry.setContext('action', { _id: action._id });
    navigation.push('Action', {
      ...action,
      fromRoute: 'ActionsList',
    });
  };
  const renderActionRow = ({ item: action }) => (
    <ActionRow
      action={action}
      onPseudoPress={() => {
        const person = persons.find((p) => action.person === p._id);
        Sentry.setContext('person', { _id: person._id });
        navigation.push('Persons', {
          screen: 'Person',
          params: { ...person, fromRoute: 'ActionsList' },
        });
      }}
      onActionPress={() => onActionPress(action)}
    />
  );

  const actionsInSections = useMemo(() => {
    if (![TODO].includes(status)) return [];
    return formatData(actionsByStatus, status);
  }, [actionsByStatus, status]);

  const renderSectionsList = () => (
    <SectionListStyled
      onScroll={onScroll}
      refreshing={refreshing}
      onRefresh={onRefresh}
      sections={actionsInSections || []}
      extraData={loading}
      initialNumToRender={20}
      renderItem={renderActionRow}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      ListEmptyComponent={loading ? Spinner : ListEmptyActions}
      ListFooterComponent={ListFooterComponent}
      parentScroll={parentScroll}
    />
  );

  const actionsToShow = useMemo(() => {
    if (![DONE, CANCEL].includes(status)) return [];
    return actionsByStatus;
  }, [actionsByStatus, status]);

  const renderFlatList = () => (
    <FlatListStyled
      refreshing={refreshing}
      onScroll={onScroll}
      onRefresh={onRefresh}
      data={actionsToShow}
      extraData={loading}
      initialNumToRender={20}
      renderItem={renderActionRow}
      keyExtractor={keyExtractor}
      ListEmptyComponent={loading ? Spinner : ListEmptyActions}
      onEndReachedThreshold={0.3}
      ListFooterComponent={ListFooterComponent}
      parentScroll={parentScroll}
    />
  );

  return (
    <SceneContainer>
      {[TODO].includes(status) && renderSectionsList()}
      {[DONE, CANCEL].includes(status) && renderFlatList()}
      <FloatAddButton onPress={onCreateAction} />
    </SceneContainer>
  );
};

const SectionHeader = styled(MyText)`
  height: 40px;
  line-height: 40px;
  font-size: 25px;
  padding-left: 5%;
  background-color: #fff;
`;

export default ActionsList;
