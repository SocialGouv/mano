import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import SceneContainer from '../../components/SceneContainer';
import ActionRow from './ActionRow';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { MyText } from '../../components/MyText';
import FlatListStyled, { SectionListStyled } from '../../components/FlatListStyled';
import { DONE, TODO, CANCEL } from '../../recoil/actions';
import API from '../../services/api';
import { actionsDoneSelector, actionsTodoSelector, actionsCanceledSelector } from '../../recoil/selectors';
import { personsState } from '../../recoil/persons';
import { useNavigation } from '@react-navigation/native';
import { refreshTriggerState, loadingState } from '../../components/Loader';

const ActionsList = ({ status, onScroll, parentScroll }) => {
  const navigation = useNavigation();

  const loading = useRecoilValue(loadingState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const actionsDone = useRecoilValue(actionsDoneSelector);
  const actionsTodo = useRecoilValue(actionsTodoSelector);
  const actionsCanceled = useRecoilValue(actionsCanceledSelector);
  const persons = useRecoilValue(personsState);

  const actionsByStatus = useMemo(() => {
    if (status === DONE) return actionsDone;
    if (status === TODO) return actionsTodo;
    if (status === CANCEL) return actionsCanceled;
    return [];
  }, [actionsCanceled, actionsDone, actionsTodo, status]);

  useEffect(() => {
    API.navigation = navigation;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
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

  const renderSectionsList = () => (
    <SectionListStyled
      onScroll={onScroll}
      refreshing={refreshTrigger.status}
      onRefresh={onRefresh}
      sections={actionsByStatus || []}
      initialNumToRender={5}
      renderItem={renderActionRow}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      ListEmptyComponent={loading ? Spinner : ListEmptyActions}
      ListFooterComponent={ListFooterComponent}
      parentScroll={parentScroll}
    />
  );

  const renderFlatList = () => (
    <FlatListStyled
      refreshing={refreshTrigger.status}
      onScroll={onScroll}
      onRefresh={onRefresh}
      data={actionsByStatus}
      initialNumToRender={5}
      renderItem={renderActionRow}
      keyExtractor={keyExtractor}
      ListEmptyComponent={loading ? Spinner : ListEmptyActions}
      onEndReachedThreshold={0.3}
      ListFooterComponent={ListFooterComponent}
      parentScroll={parentScroll}
    />
  );

  return (
    <SceneContainer testID="actions-list">
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
