import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../config';
import picture1 from '../assets/MANO_livraison_elements-07_green.png';
import picture2 from '../assets/MANO_livraison_elements-08_green.png';
import picture3 from '../assets/MANO_livraison_elements_Plan_de_travail_green.png';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { getData } from '../services/dataManagement';
import { organisationState } from '../recoil/auth';
import { actionsState } from '../recoil/actions';
import { personsState } from '../recoil/persons';
import { territoriesState } from '../recoil/territory';
import { placesState } from '../recoil/places';
import { relsPersonPlaceState } from '../recoil/relPersonPlace';
import { territoryObservationsState } from '../recoil/territoryObservations';
import { commentsState } from '../recoil/comments';
import { capture } from '../services/sentry';
import useApi from '../services/api';
import { reportsState } from '../recoil/reports';

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const loadingState = atom({
  key: 'loadingState',
  default: '',
});

const progressState = atom({
  key: 'progressState',
  default: 0,
});

const loaderFullScreenState = atom({
  key: 'loaderFullScreenState',
  default: true,
});

export const refreshTriggerState = atom({
  key: 'refreshTriggerState',
  default: {
    status: false,
    options: { showFullScreen: false, initialLoad: false },
  },
});

const lastRefreshState = atom({
  key: 'lastRefreshState',
  default: 0,
});

const mergeItems = (oldItems, newItems) =>
  [...oldItems, ...newItems].reduce((items, item) => {
    if (items.find((i) => i?.id === item._id)) return items.map((i) => (i._id === item._id ? item : i));
    return [...items, item];
  }, []);

const Loader = () => {
  const API = useApi();
  const [picture, setPicture] = useState([picture1, picture3, picture2][randomIntFromInterval(0, 2)]);
  const [lastRefresh, setLastRefresh] = useRecoilState(lastRefreshState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [fullScreen, setFullScreen] = useRecoilState(loaderFullScreenState);
  const organisation = useRecoilValue(organisationState);
  const organisationId = organisation?._id;

  const [persons, setPersons] = useRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [reports, setReports] = useRecoilState(reportsState);
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [places, setPlaces] = useRecoilState(placesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const [territoryObservations, setTerritoryObs] = useRecoilState(territoryObservationsState);
  const [comments, setComments] = useRecoilState(commentsState);

  const refresh = async () => {
    const { showFullScreen, initialLoad } = refreshTrigger.options;
    setFullScreen(showFullScreen);
    /*
    Get number of data to download to show the appropriate loading progress bar
    */
    const response = await API.get({
      path: '/public/stats',
      query: { organisation: organisationId, lastRefresh },
    });
    if (!response.ok) {
      capture('error getting stats', { extra: response });
      setRefreshTrigger({
        status: false,
        options: { showFullScreen: false, initialLoad: false },
      });
      return;
    }
    const total =
      (response.data.actions || 1) +
      (response.data.persons || 1) +
      (response.data.territories || 1) +
      (response.data.territoryObservations || 1) +
      (response.data.places || 1) +
      (response.data.comments || 1) +
      (response.data.reports || 1) +
      (response.data.relsPersonPlace || 1);
    /*
    Get persons
    */
    setLoading('Chargement des personnes');
    const refreshedPersons = await getData({
      collectionName: 'person',
      data: persons,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newPersons) => setPersons((oldPersons) => (initialLoad ? [...oldPersons, ...newPersons] : mergeItems(oldPersons, newPersons))),
      API,
    });
    if (refreshedPersons) setPersons(refreshedPersons.sort((p1, p2) => p1.name.localeCompare(p2.name)));
    /*
    Get actions
    */
    setLoading('Chargement des actions');
    const refreshedActions = await getData({
      collectionName: 'action',
      data: actions,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newActions) => setActions((oldActions) => (initialLoad ? [...oldActions, ...newActions] : mergeItems(oldActions, newActions))),
      API,
    });
    if (refreshedActions) setActions(refreshedActions);
    /*
    Get territories
    */
    setLoading('Chargement des territoires');
    const refreshedTerritories = await getData({
      collectionName: 'territory',
      data: territories,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newTerritories) =>
        setTerritories((oldTerritories) => (initialLoad ? [...oldTerritories, ...newTerritories] : mergeItems(oldTerritories, newTerritories))),
      API,
    });
    if (refreshedTerritories) setTerritories(refreshedTerritories);

    /*
    Get places
    */
    setLoading('Chargement des lieux');
    const refreshedPlaces = await getData({
      collectionName: 'place',
      data: places,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newPlaces) => setPlaces((oldPlaces) => (initialLoad ? [...oldPlaces, ...newPlaces] : mergeItems(oldPlaces, newPlaces))),
      API,
    });
    if (refreshedPlaces) setPlaces(refreshedPlaces.sort((p1, p2) => p1.name.localeCompare(p2.name)));
    const refreshedRelPersonPlaces = await getData({
      collectionName: 'relPersonPlace',
      data: relsPersonPlace,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newRelPerPlace) =>
        setRelsPersonPlace((oldRelPerPlace) => (initialLoad ? [...oldRelPerPlace, ...newRelPerPlace] : mergeItems(oldRelPerPlace, newRelPerPlace))),
      API,
    });
    if (refreshedRelPersonPlaces) setRelsPersonPlace(refreshedRelPersonPlaces);
    /*
    Get reports
    */
    setLoading('Chargement des comptes-rendus');
    const refreshedReports = await getData({
      collectionName: 'report',
      data: reports,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newReports) => setReports((oldReports) => (initialLoad ? [...oldReports, ...newReports] : mergeItems(oldReports, newReports))),
      API,
    });
    if (refreshedReports) setReports(refreshedReports);
    /*
    Switch to not full screen
    */
    setFullScreen(false);

    /*
    Get observations territories
    */
    setLoading('Chargement des observations');
    const refreshedObs = await getData({
      collectionName: 'territory-observation',
      data: territoryObservations,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newObs) => setTerritoryObs((oldObs) => (initialLoad ? [...oldObs, ...newObs] : mergeItems(oldObs, newObs))),
      API,
    });
    if (refreshedObs) setTerritoryObs(refreshedObs);
    /*
    Get comments
    */
    setLoading('Chargement des commentaires');
    const refreshedComments = await getData({
      collectionName: 'comment',
      data: comments,
      isInitialization: initialLoad,
      setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
      lastRefresh,
      setBatchData: (newComments) =>
        setComments((oldComments) => (initialLoad ? [...oldComments, ...newComments] : mergeItems(oldComments, newComments))),
      API,
    });
    if (refreshedComments) setComments(refreshedComments);

    /*
    Reset refresh trigger
    */
    await new Promise((res) => setTimeout(res, 150));
    setLastRefresh(Date.now());
    setLoading('');
    setProgress(0);
    setFullScreen(false);
    setRefreshTrigger({
      status: false,
      options: { showFullScreen: false, initialLoad: false },
    });
  };

  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  useEffect(() => {
    if (refreshTrigger.status === true) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger.status]);

  useEffect(() => {
    setPicture([picture1, picture3, picture2][randomIntFromInterval(0, 2)]);
  }, [fullScreen]);

  if (!loading)
    return (
      <Hidden>
        <Picture src={picture1} />
        <Picture src={picture2} />
        <Picture src={picture3} />
      </Hidden>
    );
  if (fullScreen) {
    return (
      <FullScreenContainer>
        <InsideContainer>
          <Picture src={picture} />
          <ProgressContainer>
            <Progress progress={progress} />
          </ProgressContainer>
          <Caption>{loading}</Caption>
        </InsideContainer>
      </FullScreenContainer>
    );
  }

  return (
    <Container>
      <ProgressContainer>
        <Progress progress={progress} />
      </ProgressContainer>
      <Caption>{loading}</Caption>
    </Container>
  );
};

const Hidden = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
`;

const FullScreenContainer = styled.div`
  width: 100%;
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  box-sizing: border-box;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InsideContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 50vw;
  max-width: 50vh;
  height: 50vh;
  max-height: 50vw;
  justify-content: center;
  align-items: center;
`;

const Picture = styled.div`
  background-image: url(${(props) => props.src});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 80%;
`;

const Container = styled.div`
  width: 100%;
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
`;

const Caption = styled.span`
  width: 100%;
  color: ${theme.main};
  padding: 0px 5px;
  text-align: left;
  display: block;
  box-sizing: border-box;
  font-size: 10px;
`;

const ProgressContainer = styled.div`
  width: 100%;
  /* height: 7px; */
`;

const Progress = styled.div`
  width: ${(p) => p.progress * 100}%;
  min-width: 10%;
  height: 5px;
  background-color: ${theme.main};
`;

export default Loader;
