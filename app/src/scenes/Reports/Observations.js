import { useRecoilState, useRecoilValue } from 'recoil';
import React, { useCallback } from 'react';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import { refreshTriggerState } from '../../components/Loader';
import FlatListStyled from '../../components/FlatListStyled';
import { ListNoMoreObservations } from '../../components/ListEmptyContainer';
import { observationsForReport } from './selectors';
import { getPeriodTitle } from './utils';
import { currentTeamState } from '../../recoil/auth';
import TerritoryObservationRow from '../Territories/TerritoryObservationRow';
import { territoriesState } from '../../recoil/territory';
const keyExtractor = (item) => item._id;

const Observations = ({ navigation, route }) => {
  const { date } = route.params;
  const observations = useRecoilValue(observationsForReport({ date }));
  const territories = useRecoilValue(territoriesState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const currentTeam = useRecoilValue(currentTeamState);

  const onRefresh = useCallback(async () => {
    setRefreshTrigger({ status: true, options: { showFullScreen: false, initialLoad: false } });
  }, [setRefreshTrigger]);

  const onUpdatObs = useCallback(
    (obs) => navigation.navigate('TerritoryObservation', { obs, territory: territories.find((t) => t._id === obs.territory), editable: true }),
    [navigation, territories]
  );

  const onTerritoryPress = useCallback((territory) => navigation.push('Territory', { territory }), [navigation]);

  const renderItem = ({ item }) => {
    const obs = item;
    const territory = territories.find((t) => t._id === obs.territory);
    return (
      <TerritoryObservationRow
        key={obs._id}
        observation={obs}
        onUpdate={onUpdatObs}
        territoryToShow={territory}
        onTerritoryPress={onTerritoryPress}
      />
    );
  };

  return (
    <SceneContainer>
      <ScreenTitle title={`Observations\n${getPeriodTitle(date, currentTeam?.nightSession)}`} onBack={navigation.goBack} />
      <FlatListStyled
        refreshing={refreshTrigger.status}
        onRefresh={onRefresh}
        data={observations}
        initialNumToRender={5}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={0.3}
        ListFooterComponent={ListNoMoreObservations}
      />
    </SceneContainer>
  );
};

export default Observations;
