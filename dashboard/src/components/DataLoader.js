import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import { personsState } from '../recoil/persons';
import { treatmentsState } from '../recoil/treatments';
import { actionsState } from '../recoil/actions';
import { medicalFileState } from '../recoil/medicalFiles';
import { passagesState } from '../recoil/passages';
import { reportsState } from '../recoil/reports';
import { territoriesState } from '../recoil/territory';
import { placesState } from '../recoil/places';
import { relsPersonPlaceState } from '../recoil/relPersonPlace';
import { territoryObservationsState } from '../recoil/territoryObservations';
import { consultationsState, whitelistAllowedData } from '../recoil/consultations';
import { commentsState } from '../recoil/comments';
import { organisationState, userState } from '../recoil/auth';

import { clearCache, getCacheItem, getCacheItemDefaultValue, setCacheItem } from '../services/dataManagement';
import useApi from '../services/api';
import { dayjsInstance } from '../services/date';
import { RandomPicture, RandomPicturePreloader } from './LoaderRandomPicture';
import ProgressBar from './LoaderProgressBar';
import useDataMigrator from './DataMigrator';

// Update to flush cache.
const currentCacheKey = 'mano-last-refresh-2022-05-30';

const cacheEffect = ({ onSet }) => {
  onSet(async (newValue) => {
    await setCacheItem(currentCacheKey, newValue);
  });
};

const loaderTriggerState = atom({ key: 'loaderTriggerState', default: false });
const isLoadingState = atom({ key: 'isLoadingState', default: false });
const initialLoadState = atom({ key: 'isInitialLoadState', default: false });
const fullScreenState = atom({ key: 'fullScreenState', default: true });
const lastLoadState = atom({ key: 'lastLoadState', default: null, effects: [cacheEffect] });
export const loadingTextState = atom({ key: 'loadingTextState', default: 'Chargement des données' });

export default function DataLoader() {
  const API = useApi();
  const user = useRecoilValue(userState);
  const { migrateData } = useDataMigrator();

  const [persons, setPersons] = useRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [consultations, setConsultations] = useRecoilState(consultationsState);
  const [treatments, setTreatments] = useRecoilState(treatmentsState);
  const [medicalFiles, setMedicalFiles] = useRecoilState(medicalFileState);
  const [passages, setPassages] = useRecoilState(passagesState);
  const [reports, setReports] = useRecoilState(reportsState);
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [places, setPlaces] = useRecoilState(placesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const [comments, setComments] = useRecoilState(commentsState);

  const [loaderTrigger, setLoaderTrigger] = useRecoilState(loaderTriggerState);
  const [lastLoad, setLastLoad] = useRecoilState(lastLoadState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [fullScreen, setFullScreen] = useRecoilState(fullScreenState);
  const [loadingText, setLoadingText] = useRecoilState(loadingTextState);
  const organisation = useRecoilValue(organisationState);
  const initialLoad = useRecoilValue(initialLoadState);

  const [loadList, setLoadList] = useState({ list: [], offset: 0 });
  const [progressBuffer, setProgressBuffer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [total, setTotal] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(initLoader, [progress, total, loaderTrigger, loadList.list.length]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fetchData, [loadList]);
  useEffect(updateProgress, [progress, progressBuffer]);

  const organisationId = organisation?._id;

  // Loader initialization: get data from cache, check stats, init recoils states, and start loader.
  function initLoader() {
    if (loadList.list.length > 0) return;

    const shouldStart = progress === null && total === null && loaderTrigger && isLoading;
    const shouldStop = progress !== null && total !== null && isLoading;

    if (shouldStart) {
      Promise.resolve()
        .then(() => (initialLoad ? migrateData() : Promise.resolve()))
        .then(() => getCacheItem(currentCacheKey))
        .then((lastLoadValue) => {
          setLastLoad(lastLoadValue || 0);
          API.get({
            path: '/organisation/stats',
            query: {
              organisation: organisationId,
              after: lastLoadValue || 0,
              withDeleted: true,
              // Medical data is never saved in cache so we always have to download all at every page reload.
              withAllMedicalData: initialLoad,
            },
          }).then(({ data: stats }) => {
            const newList = [];
            let itemsCount =
              0 +
              stats.persons +
              stats.consultations +
              stats.treatments +
              stats.medicalFiles +
              stats.passages +
              stats.reports +
              stats.territories +
              stats.places +
              stats.relsPersonPlace +
              stats.territoryObservations +
              stats.comments;

            if (stats.persons) newList.push('person');
            if (stats.consultations) newList.push('consultation');
            if (stats.treatments) newList.push('treatment');
            if (stats.medicalFiles) newList.push('medicalFile');
            if (stats.reports) newList.push('report');
            if (stats.passages) newList.push('passage');
            if (stats.actions) newList.push('action');
            if (stats.territories) newList.push('territory');
            if (stats.places) newList.push('place');
            if (stats.relsPersonPlace) newList.push('relsPersonPlace');
            if (stats.territoryObservations) newList.push('territoryObservation');
            if (stats.comments) newList.push('comment');

            // In case this is not the initial load, we don't have to load from cache again.
            if (!initialLoad) {
              startLoader(newList, itemsCount);
              return;
            }

            setLoadingText('Récupération des données dans le cache');
            Promise.resolve()
              .then(() => getCacheItemDefaultValue('person', []))
              .then((persons) => setPersons([...persons]))
              .then(() => getCacheItemDefaultValue('report', []))
              .then((reports) => setReports([...reports]))
              .then(() => getCacheItemDefaultValue('passage', []))
              .then((passages) => setPassages([...passages]))
              .then(() => getCacheItemDefaultValue('action', []))
              .then((actions) => setActions([...actions]))
              .then(() => getCacheItemDefaultValue('territory', []))
              .then((territories) => setTerritories([...territories]))
              .then(() => getCacheItemDefaultValue('place', []))
              .then((places) => setPlaces([...places]))
              .then(() => getCacheItemDefaultValue('relsPersonPlace', []))
              .then((relsPersonPlace) => setRelsPersonPlace([...relsPersonPlace]))
              .then(() => getCacheItemDefaultValue('territoryObservation', []))
              .then((territoryObservations) => setTerritoryObservations([...territoryObservations]))
              .then(() => getCacheItemDefaultValue('comment', []))
              .then((comments) => setComments([...comments]))
              .then(() => startLoader(newList, itemsCount));
          });
        });
    } else if (shouldStop) stopLoader();
  }

  // Fetch data from API, handle loader progress.
  function fetchData() {
    (async () => {
      if (loadList.list.length === 0) return;

      const [current] = loadList.list;
      const query = {
        organisation: organisationId,
        limit: String(1000),
        page: String(loadList.offset),
        after: lastLoad,
        withDeleted: Boolean(lastLoad),
      };

      function handleMore(hasMore) {
        if (hasMore) setLoadList({ list: loadList.list, offset: loadList.offset + 1 });
        else setLoadList({ list: loadList.list.slice(1), offset: 0 });
      }

      if (current === 'person') {
        setLoadingText('Chargement des personnes');
        const res = await API.get({ path: '/person', query });
        setPersons(
          res.hasMore
            ? mergeItems(persons, res.decryptedData)
            : mergeItems(persons, res.decryptedData)
                .map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt }))
                .sort((p1, p2) => (p1.name || '').localeCompare(p2.name || ''))
        );
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'consultation') {
        setLoadingText('Chargement des consultations');
        const res = await API.get({ path: '/consultation', query: { ...query, after: initialLoad ? 0 : lastLoad } });
        setConsultations(
          res.hasMore
            ? mergeItems(consultations, res.decryptedData)
            : mergeItems(consultations, res.decryptedData).map((c) => whitelistAllowedData(c, user))
        );
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'treatment') {
        setLoadingText('Chargement des traitements');
        const res = await API.get({ path: '/treatment', query: { ...query, after: initialLoad ? 0 : lastLoad } });
        setTreatments(mergeItems(treatments, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'medicalFile') {
        setLoadingText('Chargement des fichiers médicaux');
        const res = await API.get({ path: '/medical-file', query: { ...query, after: initialLoad ? 0 : lastLoad } });
        setMedicalFiles(mergeItems(medicalFiles, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'report') {
        setLoadingText('Chargement des rapports');
        const res = await API.get({ path: '/report', query });
        setReports(
          res.hasMore
            ? mergeItems(reports, res.decryptedData)
            : mergeItems(reports, res.decryptedData)
                // This line should be removed when `clean-reports-with-no-team-nor-date` migration has run on all organisations.
                .filter((r) => !!r.team && !!r.date)
                .sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1))
        );
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'passage') {
        setLoadingText('Chargement des passages');
        const res = await API.get({ path: '/passage', query });
        setPassages(
          res.hasMore
            ? mergeItems(passages, res.decryptedData)
            : mergeItems(passages, res.decryptedData).sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1))
        );
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'action') {
        setFullScreen(false);
        setLoadingText('Chargement des actions');
        const res = await API.get({ path: '/action', query });
        setActions(mergeItems(actions, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'territory') {
        setLoadingText('Chargement des territoires');
        const res = await API.get({ path: '/territory', query });
        setTerritories(mergeItems(territories, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'place') {
        setLoadingText('Chargement des lieux');
        const res = await API.get({ path: '/place', query });
        setPlaces(mergeItems(places, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'relsPersonPlace') {
        setLoadingText('Chargement des relations personne-lieu');
        const res = await API.get({ path: '/relPersonPlace', query });
        setRelsPersonPlace(mergeItems(relsPersonPlace, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'territoryObservation') {
        setLoadingText('Chargement des observations de territoire');
        const res = await API.get({ path: '/territory-observation', query });
        setTerritoryObservations(mergeItems(territoryObservations, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'comment') {
        setLoadingText('Chargement des commentaires');
        const res = await API.get({ path: '/comment', query });
        setComments(mergeItems(comments, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      }
    })();
  }

  function startLoader(list, itemsCount) {
    setLoadList({ list, offset: 0 });
    setLoaderTrigger(false);
    setProgress(0);
    setTotal(itemsCount);
  }

  function stopLoader() {
    setIsLoading(false);
    setLastLoad(Date.now());
    setProgressBuffer(null);
    setProgress(null);
    setTotal(null);
  }

  function updateProgress() {
    if (progressBuffer !== null) {
      setProgressBuffer(null);
      setProgress((progress || 0) + progressBuffer);
    }
  }

  if (!isLoading) return <RandomPicturePreloader />;
  if (!total && !fullScreen) return null;

  if (fullScreen) {
    return (
      <FullScreenContainer>
        <InsideContainer>
          <RandomPicture />
          <ProgressBar progress={progress} total={total} loadingText={loadingText} />
        </InsideContainer>
      </FullScreenContainer>
    );
  }

  return (
    <Container>
      <ProgressBar progress={progress} total={total} loadingText={loadingText} />
    </Container>
  );
}

export function useDataLoader(options = { refreshOnMount: false }) {
  const [fullScreen, setFullScreen] = useRecoilState(fullScreenState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const setLoaderTrigger = useSetRecoilState(loaderTriggerState);
  const setInitialLoad = useSetRecoilState(initialLoadState);
  const setLoadingText = useSetRecoilState(loadingTextState);
  const setLastLoad = useSetRecoilState(lastLoadState);

  useEffect(function refreshOnMountEffect() {
    if (options.refreshOnMount && !isLoading) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    setFullScreen(false);
    setInitialLoad(false);
    setLoaderTrigger(true);
    setIsLoading(true);
    setLoadingText('Mise à jour des données');
  }
  function load() {
    setFullScreen(true);
    setInitialLoad(true);
    setLoaderTrigger(true);
    setIsLoading(true);
    setLoadingText('Chargement des données');
  }

  function resetCache() {
    return clearCache().then(() => setLastLoad(0));
  }

  return {
    refresh,
    load,
    resetCache,
    isLoading: Boolean(isLoading),
    isFullScreen: Boolean(fullScreen),
  };
}

function mergeItems(oldItems, newItems) {
  const newItemsIds = newItems.map((i) => i._id);
  const oldItemsPurged = oldItems.filter((i) => !newItemsIds.includes(i._id));
  return [...oldItemsPurged, ...newItems].filter((e) => !e.deletedAt);
}

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

const Container = styled.div`
  width: 100%;
  z-index: 1000;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
`;
