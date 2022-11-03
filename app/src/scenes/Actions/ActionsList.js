import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import ActionRow from '../../components/ActionRow';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { MyText } from '../../components/MyText';
import { FlashListStyled } from '../../components/Lists';
import { TODO } from '../../recoil/actions';
import { actionsByStatusSelector, totalActionsByStatusSelector } from '../../recoil/selectors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { refreshTriggerState, loadingState, loaderFullScreenState } from '../../components/Loader';
import Button from '../../components/Button';
import ConsultationRow from '../../components/ConsultationRow';

const keyExtractor = (action) => action._id;

const limitSteps = 100;

const ActionsList = () => {
  const navigation = useNavigation();
  const loading = useRecoilValue(loadingState);
  const fullScreen = useRecoilValue(loaderFullScreenState);

  const status = useRoute().params.status;
  const [limit, setLimit] = useState(limitSteps);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status, limit }));
  const total = useRecoilValue(totalActionsByStatusSelector({ status }));

  const hasMore = useMemo(() => limit < total, [limit, total]);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onCreateAction = useCallback(() => navigation.navigate('NewActionForm', { fromRoute: 'ActionsList' }), [navigation]);

  const FlatListFooterComponent = useMemo(() => {
    if ([TODO].includes(status)) return !actionsByStatus.length ? null : ListNoMoreActions;
    if (hasMore) return <Button caption="Montrer plus d'actions" onPress={() => setLimit((l) => l + limitSteps)} testID="show-more-actions" />;
    return ListNoMoreActions;
  }, [hasMore, status, actionsByStatus.length]);

  const ListEmptyComponent = useMemo(() => (loading ? Spinner : ListEmptyActions), [loading]);

  const onPseudoPress = useCallback(
    (person) => {
      Sentry.setContext('person', { _id: person._id });
      navigation.push('Person', { person, fromRoute: 'ActionsList' });
    },
    [navigation]
  );

  const onActionPress = useCallback(
    (action) => {
      Sentry.setContext('action', { _id: action._id });
      navigation.push('Action', {
        action,
        fromRoute: 'ActionsList',
      });
    },
    [navigation]
  );

  const onConsultationPress = useCallback(
    (consultationDB, personDB) => {
      navigation.navigate('Consultation', { personDB, consultationDB, fromRoute: 'ActionsList' });
    },
    [navigation]
  );

  const renderItem = ({ item }) => {
    if (item.type === 'title') return <SectionHeaderStyled heavy>{item.title}</SectionHeaderStyled>;
    if (item.isConsultation) {
      return <ConsultationRow consultation={item} onConsultationPress={onConsultationPress} onPseudoPress={onPseudoPress} withBadge showPseudo />;
    }
    return <ActionRow action={item} onPseudoPress={onPseudoPress} onActionPress={onActionPress} />;
  };

  const getItemType = (item) => item.type || 'action';

  if (fullScreen) return null;

  return (
    <>
      <FlashListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        data={actionsByStatus}
        estimatedItemSize={126}
        getItemType={getItemType}
        initialNumToRender={5}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        onEndReachedThreshold={0.3}
        ListFooterComponent={FlatListFooterComponent}
      />
      <FloatAddButton onPress={onCreateAction} />
    </>
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
