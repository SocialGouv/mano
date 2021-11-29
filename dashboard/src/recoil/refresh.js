import { useActions } from './actions';
import { useAuth } from './auth';
import { useComments } from './comments';
import { usePersons } from './persons';
import { usePlaces } from './places';
import { useRelsPerson } from './relPersonPlace';
import { useReports } from './reports';
import { useTerritories } from './territory';
import useApi from '../services/api';
import { useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import { useTerritoryObservations } from './territoryObservations';
import { atom, useRecoilState } from 'recoil';

const loadingState = atom({
  key: 'loadingState',
  default: '',
});

const progressState = atom({
  key: 'progressState',
  default: 0,
});

const loaderFullScreenState = atom({
  key: 'loaderFullScreenState',
  default: false,
});

export const useRefresh = () => {
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh', 0);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [fullScreen, setFullScreen] = useRecoilState(loaderFullScreenState);
  const API = useApi();

  const { refreshActions } = useActions();
  const { refreshPersons } = usePersons();
  const { refreshComments } = useComments();
  const { refreshTerritories } = useTerritories();
  const { refreshTerritoryObs } = useTerritoryObservations();
  const { refreshPlaces } = usePlaces();
  const { refreshRelsPersonPlace } = useRelsPerson();
  const { refreshReports } = useReports();
  const { organisationId } = useAuth();

  const reset = async () => {
    await new Promise((res) => setTimeout(res, 150));
    setLoading('');
    setProgress(0);
    setFullScreen(false);
  };

  const getTotal = async (initialLoad = false) => {
    setLoading('Chargement...');
    const response = await API.get({
      path: '/public/stats',
      query: { organisation: organisationId, lastRefresh },
    });
    if (!response.ok) {
      capture('error getting stats', { extra: response });
      return {};
    }
    setLastRefresh(Date.now());
    return response.data || {};
  };

  const refresh = async ({ showFullScreen = false, initialLoad = false } = {}, onOk) => {
    try {
      setFullScreen(showFullScreen);

      const { actions, persons, territories, territoryObservations, places, relsPersonPlace, comments, reports } = await getTotal(initialLoad);
      // fior a better UX for the loader, it's better to have at least one item
      const total =
        (actions || 1) +
        (persons || 1) +
        (territories || 1) +
        (territoryObservations || 1) +
        (places || 1) +
        (comments || 1) +
        (reports || 1) +
        (relsPersonPlace || 1);

      setLoading('Chargement des personnes');
      const isOK = await refreshPersons((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      if (!isOK) {
        reset();
        return false;
      }

      if (isOK && onOk) onOk();

      setLoading('Chargement des actions');
      await refreshActions((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des territoires');
      await refreshTerritories((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des lieux');
      await refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);
      await refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des comptes-rendus');
      await refreshReports((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setFullScreen(false);

      setLoading('Chargement des observations');
      await refreshTerritoryObs((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des commentaires');
      await refreshComments((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      reset();
      return true;
    } catch (error) {
      capture('error loading app ' + error, { extra: { error } });
      return false;
    }
  };

  const actionsRefresher = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { actions, persons, comments } = await getTotal();
    const total = (actions || 1) + (persons || 1) + (comments || 1);

    setLoading('Chargement des actions');
    await refreshActions((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des personnes');
    await refreshPersons((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des commentaires');
    await refreshComments((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  const personsRefresher = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { actions, persons, comments, places, relsPersonPlace } = await getTotal();
    const total = actions + persons + comments + places + relsPersonPlace;

    setLoading('Chargement des personnes');
    await refreshPersons((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des actions');
    await refreshActions((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des lieux');
    await refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total));
    await refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des commentaires');
    await refreshComments((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  const territoriesRefresher = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { territories, territoryObservations } = await getTotal();
    const total = territories + territoryObservations;

    setLoading('Chargement des observations');
    await refreshTerritoryObs((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des territoires');
    await refreshTerritories((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  const placesAndRelationsRefresher = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { places, relsPersonPlace } = await getTotal();
    const total = places + relsPersonPlace;

    setLoading('Chargement des lieux');
    await refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total));
    await refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  const reportsRefresher = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { reports } = await getTotal();
    const total = reports || 1;

    setLoading('Chargement des comptes-rendus');
    await refreshReports((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  return {
    loading,
    progress,
    fullScreen,
    refresh,
    actionsRefresher,
    personsRefresher,
    reportsRefresher,
    territoriesRefresher,
    placesAndRelationsRefresher,
  };
};
