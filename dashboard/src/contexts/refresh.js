import React, { useContext, useState } from 'react';
import Loader from '../components/Loader';
import API from '../services/api';
import { useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import ActionsContext from './actions';
import AuthContext from './auth';
import CommentsContext from './comments';
import PersonsContext from './persons';
import PlacesContext from './places';
import RelsPersonPlaceContext from './relPersonPlace';
import ReportsContext from './reports';
import TerritoryContext from './territory';
import TerritoryObservationsContext from './territoryObservations';

const RefreshContext = React.createContext();

export const RefreshProvider = ({ children }) => {
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh', 0);
  const [loading, setLoading] = useState('');
  const [progress, setProgress] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);

  const actionsContext = useContext(ActionsContext);
  const personsContext = useContext(PersonsContext);
  const commentsContext = useContext(CommentsContext);
  const territoryContext = useContext(TerritoryContext);
  const territoryObservationsContext = useContext(TerritoryObservationsContext);
  const placesContext = useContext(PlacesContext);
  const relsPersonPlaceContext = useContext(RelsPersonPlaceContext);
  const reportsContext = useContext(ReportsContext);
  const { organisation } = useContext(AuthContext);

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
      query: { organisation: organisation._id, lastRefresh },
    });
    if (!response.ok) {
      capture('error getting stats', { extra: response });
      return {};
    }
    setLastRefresh(Date.now());
    return response.data || {};
  };

  const refresh = async ({ showFullScreen = false, initialLoad = false } = {}) => {
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
      const isOK = await personsContext.refreshPersons((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      if (!isOK) return reset();

      setLoading('Chargement des actions');
      await actionsContext.refreshActions((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des territoires');
      await territoryContext.refreshTerritories((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des lieux');
      await placesContext.refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);
      await relsPersonPlaceContext.refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des rapports');
      await reportsContext.refreshReports((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setFullScreen(false);

      setLoading('Chargement des observations');
      await territoryObservationsContext.refreshTerritoryObs((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      setLoading('Chargement des commentaires');
      await commentsContext.refreshComments((batch) => setProgress((p) => (p * total + batch) / total), initialLoad);

      reset();
    } catch (error) {
      capture('error loading app ' + error, { extra: { error } });
    }
  };

  const refreshActions = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { actions, persons, comments } = await getTotal();
    const total = (actions || 1) + (persons || 1) + (comments || 1);
    console.log({ actions, persons, comments });

    setLoading('Chargement des actions');
    await actionsContext.refreshActions((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des personnes');
    await personsContext.refreshPersons((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des commentaires');
    await commentsContext.refreshComments((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  const refreshPersons = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { actions, persons, comments, places, relsPersonPlace } = await getTotal();
    const total = actions + persons + comments + places + relsPersonPlace;

    setLoading('Chargement des personnes');
    await personsContext.refreshPersons((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des actions');
    await actionsContext.refreshActions((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des lieux');
    await placesContext.refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total));
    await relsPersonPlaceContext.refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des commentaires');
    await commentsContext.refreshComments((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  const refreshTerritories = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { territories, territoryObservations } = await getTotal();
    const total = territories + territoryObservations;

    setLoading('Chargement des observations');
    await territoryObservationsContext.refreshTerritoryObs((batch) => setProgress((p) => (p * total + batch) / total));

    setLoading('Chargement des territoires');
    await territoryContext.refreshTerritories((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  const refreshPlacesAndRelations = async (showFullScreen = false) => {
    setFullScreen(showFullScreen);

    const { places, relsPersonPlace } = await getTotal();
    const total = places + relsPersonPlace;

    setLoading('Chargement des lieux');
    await placesContext.refreshPlaces((batch) => setProgress((p) => (p * total + batch) / total));
    await relsPersonPlaceContext.refreshRelsPersonPlace((batch) => setProgress((p) => (p * total + batch) / total));

    reset();
  };

  return (
    <RefreshContext.Provider
      value={{
        loading,
        refresh,
        refreshActions,
        refreshPersons,
        refreshTerritories,
        refreshPlacesAndRelations,
      }}>
      {children}
      <Loader loading={loading} fullScreen={fullScreen} progress={progress} />
    </RefreshContext.Provider>
  );
};

export default RefreshContext;
