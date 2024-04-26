import React, { useCallback, useMemo } from 'react';
import * as Sentry from '@sentry/react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import SceneContainer from '../../components/SceneContainer';
import Spinner from '../../components/Spinner';
import { ListEmptyActions, ListNoMoreActions } from '../../components/ListEmptyContainer';
import { FlashListStyled } from '../../components/Lists';
import { refreshTriggerState, loadingState } from '../../components/Loader';
import { consultationsForReport } from './selectors';
import ScreenTitle from '../../components/ScreenTitle';
import { CANCEL, DONE } from '../../recoil/actions';
import { currentTeamState } from '../../recoil/auth';
import { getPeriodTitle } from './utils';
import ConsultationRow from '../../components/ConsultationRow';

const keyExtractor = (consultation) => consultation._id;

const Consultations = ({ route, navigation }) => {
  const loading = useRecoilValue(loadingState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);
  const { status, date } = route.params;

  const { consultationsCreated, consultationsCompleted, consultationsCanceled } = useRecoilValue(consultationsForReport({ date }));

  const consultationsToShow = useMemo(() => {
    if (!status) return consultationsCreated;
    if (status === DONE) return consultationsCompleted;
    if (status === CANCEL) return consultationsCanceled;
    return [];
  }, [status, consultationsCreated, consultationsCompleted, consultationsCanceled]);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const ListEmptyComponent = useMemo(() => (loading ? Spinner : ListEmptyActions), [loading]);

  const onPseudoPress = useCallback(
    (person) => {
      Sentry.setContext('person', { _id: person._id });
      navigation.push('Person', { person, fromRoute: 'ActionsList' });
    },
    [navigation]
  );

  const onConsultationPress = useCallback(
    (consultationDB, personDB) => {
      navigation.navigate('Consultation', { personDB, consultationDB, fromRoute: 'Consultations' });
    },
    [navigation]
  );

  const renderItem = (item) => {
    return <ConsultationRow consultation={item.item} onConsultationPress={onConsultationPress} onPseudoPress={onPseudoPress} withBadge showPseudo />;
  };

  return (
    <SceneContainer testID="actions-list-for-report" backgroundColor="#fff">
      <ScreenTitle
        title={`Consultations ${status === DONE ? 'faites' : status === CANCEL ? 'annulées' : 'créées'}\n${getPeriodTitle(
          date,
          currentTeam?.nightSession
        )}`}
        onBack={navigation.goBack}
      />
      <FlashListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        estimatedItemSize={126}
        data={consultationsToShow}
        initialNumToRender={5}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        onEndReachedThreshold={0.3}
        ListFooterComponent={consultationsToShow.length > 0 ? ListNoMoreActions : null}
      />
    </SceneContainer>
  );
};

export default Consultations;
