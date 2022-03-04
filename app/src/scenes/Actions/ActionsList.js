import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { TODO } from '../../recoil/actions';
import API from '../../services/api';
import { actionsByStatusSelector, totalActionsByStatusSelector } from '../../recoil/selectors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import Button from '../../components/Button';

const emptyArray = [];
const keyExtractor = (action) => action._id;
const SectionHeader = ({ section: { title } }) => <SectionHeaderStyled heavy>{title}</SectionHeaderStyled>;

const limitSteps = 100;

const ActionsList = () => {
  const navigation = useNavigation();
  const loading = useRecoilValue(loadingState);
  const status = useRoute().params.status;
  const [limit, setLimit] = useState(limitSteps);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status, limit }));
  const total = useRecoilValue(totalActionsByStatusSelector({ status }));

  const hasMore = useMemo(() => limit < total, [limit, total]);

  useEffect(() => {
    API.navigation = navigation;
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onCreateAction = useCallback(() => navigation.navigate('NewActionForm', { fromRoute: 'ActionsList' }), [navigation]);

  const SectionListFooterComponent = useMemo(() => (!actionsByStatus.length ? null : ListNoMoreActions), [actionsByStatus.length]);
  const FlatListFooterComponent = useMemo(() => {
    if (hasMore) return <Button caption="Montrer plus d'actions" onPress={() => setLimit((l) => l + limitSteps)} testID="show-more-actions" />;
    return ListNoMoreActions;
  }, [hasMore]);
  const ListEmptyComponent = useMemo(() => (loading ? Spinner : ListEmptyActions), [loading]);

  const onPseudoPress = useCallback(
    (person) => {
      Sentry.setContext('person', { _id: person._id });
      navigation.push('Persons', {
        screen: 'Person',
        params: { ...person, fromRoute: 'ActionsList' },
      });
    },
    [navigation]
  );

  const onActionPress = useCallback(
    (action) => {
      Sentry.setContext('action', { _id: action._id });
      navigation.push('Action', {
        ...action,
        fromRoute: 'ActionsList',
      });
    },
    [navigation]
  );

  const renderItem = (item) => {
    return <ActionRow action={item.item} onPseudoPress={onPseudoPress} onActionPress={onActionPress} />;
  };

  return (
    <SceneContainer testID="actions-list">
      {[TODO].includes(status) ? (
        <SectionListStyled
          refreshing={refreshTrigger.status}
          onRefresh={onRefresh}
          sections={actionsByStatus || emptyArray}
          initialNumToRender={5}
          renderItem={renderItem}
          renderSectionHeader={SectionHeader}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={SectionListFooterComponent}
        />
      ) : (
        <FlatListStyled
          refreshing={refreshTrigger.status}
          onRefresh={onRefresh}
          data={actionsByStatus}
          initialNumToRender={5}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={ListEmptyComponent}
          onEndReachedThreshold={0.3}
          ListFooterComponent={FlatListFooterComponent}
        />
      )}
      <FloatAddButton onPress={onCreateAction} />
    </SceneContainer>
  );
};

const SectionHeaderStyled = styled(MyText)`
  height: 40px;
  line-height: 40px;
  font-size: 25px;
  padding-left: 5%;
  background-color: #fff;
`;

export default ActionsList;
