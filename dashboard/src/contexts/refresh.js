import React, { useState } from 'react';
import Loader from '../components/Loader';
import { useActions } from '../recoil/actions';
import useAuth from '../recoil/auth';
import { useComments } from '../recoil/comments';
import { usePersons } from '../recoil/persons';
import { usePlaces } from '../recoil/places';
import { useRelsPerson } from '../recoil/relPersonPlace';
import { useReports } from '../recoil/reports';
import { useTerritories } from '../recoil/territory';
import useApi from '../services/api-interface-with-dashboard';
import { useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import { useTerritoryObservations } from '../recoil/territoryObservations';

const RefreshContext = React.createContext();

export const RefreshProvider = ({ children }) => {
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh', 0);
  const [loading, setLoading] = useState('');
  const [progress, setProgress] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
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

  const refresh = async ({ showFullScreen = false, initialLoad = false } = {}, onDecryptOk) => {
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

      if (onDecryptOk) onDecryptOk();

      setLoading('Chargement des actions');
      await refreshActions((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des territoires');
      await refreshTerritories((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des lieux');
      await refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);
      await refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des rapports');
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

  const refreshPlacesAndRelations = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { places, relsPersonPlace } = await getTotal();
    const total = places + relsPersonPlace;

    setLoading('Chargement des lieux');
    await refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total));
    await refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  return (
    <RefreshContext.Provider
      value={{
        loading,
        refresh,
        actionsRefresher,
        personsRefresher,
        refreshTerritories,
        refreshPlacesAndRelations,
      }}>
      {children}
      <Loader loading={loading} fullScreen={fullScreen} progress={progress} />
    </RefreshContext.Provider>
  );
};

export default RefreshContext;
