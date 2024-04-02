import { useRecoilState, useRecoilValue } from 'recoil';
import React, { useCallback } from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { refreshTriggerState } from '../../components/Loader';
import { FlashListStyled } from '../../components/Lists';
import { ListEmptyRencontres, ListNoMoreRencontres } from '../../components/ListEmptyContainer';
import { rencontresForReport } from './selectors';
import { getPeriodTitle } from './utils';
import { currentTeamState } from '../../recoil/auth';
import RencontreRow from '../Persons/RencontreRow';
const keyExtractor = (item) => item._id;

const RencontresForReport = ({ navigation, route }) => {
  const date = route?.params?.date;
  const rencontres = useRecoilValue(rencontresForReport({ date }));
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onUpdateRencontre = async (person, rencontre) => {
    navigation.push('Rencontre', { person, fromRoute: 'Report', rencontre: rencontre });
  };

  const renderItem = ({ item }) => {
    const rencontre = item;

    return <RencontreRow key={rencontre._id} rencontre={rencontre} onUpdate={(person) => onUpdateRencontre(person, rencontre)} />;
  };

  return (
    <SceneContainer backgroundColor="#fff">
      <ScreenTitle title={`Rencontres \n${getPeriodTitle(date, currentTeam?.nightSession)}`} onBack={navigation.goBack} />
      <FlashListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        data={rencontres}
        initialNumToRender={5}
        estimatedItemSize={545}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={ListEmptyRencontres}
        ListFooterComponent={rencontres.length > 0 ? ListNoMoreRencontres : null}
      />
    </SceneContainer>
  );
};

export default RencontresForReport;
