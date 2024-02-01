import React, { useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react-native';
import { selectorFamily, useRecoilState, useRecoilValue } from 'recoil';
import SceneContainer from '../../components/SceneContainer';
import ActionRow from '../../components/ActionRow';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import FloatAddButton from '../../components/FloatAddButton';
import { FlashListStyled } from '../../components/Lists';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import { actionsCompletedOrCanceledForReport, actionsCreatedForReport } from './selectors';
import ScreenTitle from '../../components/ScreenTitle';
import { CANCEL, DONE } from '../../recoil/actions';
import { currentTeamState } from '../../recoil/auth';
import { getPeriodTitle } from './utils';

const keyExtractor = (action) => action._id;

const actionsToShowSelector = selectorFamily({
  key: 'actionsToShowSelector',
  get:
    ({ date, status }) =>
    ({ get }) => {
      if (!status) return get(actionsCreatedForReport({ date }));
      return get(actionsCompletedOrCanceledForReport({ date, status }));
    },
});

const Actions = ({ route, navigation }) => {
  const loading = useRecoilValue(loadingState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);
  const { status, date } = route.params;

  const actionsToShow = useRecoilValue(actionsToShowSelector({ date, status }));

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onCreateAction = useCallback(() => navigation.navigate('NewActionForm', { fromRoute: 'Actions' }), [navigation]);

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

  const renderItem = (item) => {
    return <ActionRow action={item.item} onPseudoPress={onPseudoPress} onActionPress={onActionPress} />;
  };

  return (
    <SceneContainer testID="actions-list-for-report" backgroundColor="#fff">
      <ScreenTitle
        title={`Actions ${status === DONE ? 'faites' : status === CANCEL ? 'annulées' : 'créées'}\n${getPeriodTitle(
          date,
          currentTeam?.nightSession
        )}`}
        onBack={navigation.goBack}
      />
      <FlashListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        estimatedItemSize={126}
        data={actionsToShow}
        initialNumToRender={5}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        onEndReachedThreshold={0.3}
        ListFooterComponent={actionsToShow.length > 0 ? ListNoMoreActions : null}
      />
      <FloatAddButton onPress={onCreateAction} />
    </SceneContainer>
  );
};

export default Actions;
