import { useRecoilState, useRecoilValue } from 'recoil';
import React, { useCallback } from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { refreshTriggerState } from '../../components/Loader';
import { FlashListStyled } from '../../components/Lists';
import { ListEmptyPassage, ListNoMorePassages } from '../../components/ListEmptyContainer';
import { passagesForReport } from './selectors';
import { getPeriodTitle } from './utils';
import { currentTeamState } from '../../recoil/auth';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';
import BubbleRow from '../../components/BubbleRow';
const keyExtractor = (item) => item._id;

const PassagesForReport = ({ navigation, route }) => {
  const date = route?.params?.date;
  const passages = useRecoilValue(passagesForReport({ date }));
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);
  const personsObject = useRecoilValue(itemsGroupedByPersonSelector);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const renderItem = ({ item }) => {
    const passage = item;
    return (
      <BubbleRow
        caption={passage.comment}
        date={passage.date || passage.createdAt}
        user={passage.user}
        urgent={passage.urgent}
        itemName={personsObject[passage.person]?.name || personsObject[passage.person]?.personName || 'Passage anonyme'}
        metaCaption="Passage noté par"
      />
    );
  };

  return (
    <SceneContainer backgroundColor="#fff">
      <ScreenTitle title={`passages \n${getPeriodTitle(date, currentTeam?.nightSession)}`} onBack={navigation.goBack} />
      <FlashListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        data={passages}
        initialNumToRender={5}
        estimatedItemSize={545}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={ListEmptyPassage}
        ListFooterComponent={passages.length > 0 ? ListNoMorePassages : null}
      />
    </SceneContainer>
  );
};

export default PassagesForReport;
