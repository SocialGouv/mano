import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'react-toastify';

import { personsState } from '../recoil/persons';
import { treatmentsState } from '../recoil/treatments';
import { actionsState } from '../recoil/actions';
import { medicalFileState } from '../recoil/medicalFiles';
import { passagesState } from '../recoil/passages';
import { rencontresState } from '../recoil/rencontres';
import { reportsState } from '../recoil/reports';
import { territoriesState } from '../recoil/territory';
import { placesState } from '../recoil/places';
import { relsPersonPlaceState } from '../recoil/relPersonPlace';
import { territoryObservationsState } from '../recoil/territoryObservations';
import { consultationsState, formatConsultation } from '../recoil/consultations';
import { commentsState } from '../recoil/comments';
import { organisationState, userState } from '../recoil/auth';

import { clearCache, dashboardCurrentCacheKey, getCacheItem, getCacheItemDefaultValue, setCacheItem } from '../services/dataManagement';
import API from '../services/api';
import { RandomPicture, RandomPicturePreloader } from './LoaderRandomPicture';
import ProgressBar from './LoaderProgressBar';
import useDataMigrator from './DataMigrator';
import { groupsState } from '../recoil/groups';

// Update to flush cache.

let startLoadingDate = null;

const cacheEffect = ({ onSet }) => {
  onSet(async (newValue) => {
    await setCacheItem(dashboardCurrentCacheKey, newValue);
  });
};

const loaderTriggerState = atom({ key: 'loaderTriggerState', default: false });
const isLoadingState = atom({ key: 'isLoadingState', default: false });
const initialLoadState = atom({ key: 'isInitialLoadState', default: false });
const fullScreenState = atom({ key: 'fullScreenState', default: true });
export const lastLoadState = atom({ key: 'lastLoadState', default: null, effects: [cacheEffect] });
export const loadingTextState = atom({ key: 'loadingTextState', default: 'Chargement des données' });

export default function DataLoader() {
  const [user, setUser] = useRecoilState(userState);
  const { migrateData } = useDataMigrator();

  const [persons, setPersons] = useRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [consultations, setConsultations] = useRecoilState(consultationsState);
  const [treatments, setTreatments] = useRecoilState(treatmentsState);
  const [medicalFiles, setMedicalFiles] = useRecoilState(medicalFileState);
  const [passages, setPassages] = useRecoilState(passagesState);
  const [rencontres, setRencontres] = useRecoilState(rencontresState);
  const [reports, setReports] = useRecoilState(reportsState);
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [places, setPlaces] = useRecoilState(placesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [groups, setGroups] = useRecoilState(groupsState);

  const [loaderTrigger, setLoaderTrigger] = useRecoilState(loaderTriggerState);
  const [lastLoad, setLastLoad] = useRecoilState(lastLoadState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [fullScreen, setFullScreen] = useRecoilState(fullScreenState);
  const [loadingText, setLoadingText] = useRecoilState(loadingTextState);
  const initialLoad = useRecoilValue(initialLoadState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const [loadList, setLoadList] = useState({ list: [], offset: 0 });
  const [progressBuffer, setProgressBuffer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [total, setTotal] = useState(null);

  useEffect(() => {
    initLoader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, total, loaderTrigger, loadList.list.length, isLoading]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadList]);
  useEffect(() => {
    updateProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, progressBuffer, loadList.list.length]);

  const organisationId = organisation?._id;

  // Loader initialization: get data from cache, check stats, init recoils states, and start loader.
  function initLoader() {
    if (loadList.list.length > 0) return;

    const shouldStart = progress === null && total === null && loaderTrigger && isLoading;
    const shouldStop = progress !== null && total !== null && isLoading;

    if (shouldStart) {
      console.log(Date.now() - startLoadingDate, 'shouldStart', loadingText);
      Promise.resolve()
        .then(async () => {
          /*
            Refresh organisation (and user), to get the latest organisation fields
            and the latest user roles
          */
          console.log(Date.now() - startLoadingDate, 'refresh me', loadingText);
          const userResponse = await API.get({ path: '/user/me' });
          console.log(Date.now() - startLoadingDate, 'refreshed me', loadingText);
          if (!userResponse.ok) return resetLoaderOnError();
          setOrganisation(userResponse.user.organisation);
          setUser(userResponse.user);
        })
        .then(() => {
          console.log(Date.now() - startLoadingDate, 'migrate data', loadingText);
          return initialLoad ? migrateData() : Promise.resolve();
        })
        .then(() => {
          console.log(Date.now() - startLoadingDate, 'get cache items', loadingText);
          return getCacheItem(dashboardCurrentCacheKey);
        })
        .then((lastLoadValue) => {
          setLastLoad(lastLoadValue || 0);
          console.log(Date.now() - startLoadingDate, 'get stats', loadingText);
          API.get({
            path: '/organisation/stats',
            startLoadingDate,
            query: {
              organisation: organisationId,
              after: lastLoadValue || 0,
              withDeleted: true,
              // Medical data is never saved in cache so we always have to download all at every page reload.
              withAllMedicalData: initialLoad,
            },
          }).then(({ data: stats }) => {
            console.log(Date.now() - startLoadingDate, 'got stats', loadingText);
            if (!stats) return;
            const newList = [];
            let itemsCount =
              0 +
              stats.persons +
              stats.consultations +
              stats.actions +
              stats.treatments +
              stats.medicalFiles +
              stats.passages +
              stats.rencontres +
              stats.reports +
              stats.territories +
              stats.places +
              stats.relsPersonPlace +
              stats.territoryObservations +
              stats.comments +
              stats.groups;

            if (stats.persons) newList.push('person');
            if (stats.groups) newList.push('group');
            if (['admin', 'normal'].includes(user.role)) {
              if (stats.consultations) newList.push('consultation');
              if (stats.treatments) newList.push('treatment');
              if (stats.medicalFiles) newList.push('medicalFile');
            }
            if (stats.reports) newList.push('report');
            if (stats.passages) newList.push('passage');
            if (stats.rencontres) newList.push('rencontre');
            if (stats.actions) newList.push('action');
            if (stats.territories) newList.push('territory');
            if (stats.places) newList.push('place');
            if (stats.relsPersonPlace) newList.push('relsPersonPlace');
            if (stats.territoryObservations) newList.push('territoryObservation');
            if (stats.comments) newList.push('comment');

            console.log(Date.now() - startLoadingDate, 'list pushed', loadingText);
            // In case this is not the initial load, we don't have to load from cache again.
            if (!initialLoad) {
              console.log(Date.now() - startLoadingDate, 'not init load start loader', loadingText);
              startLoader(newList, itemsCount);
              return;
            }

            setLoadingText('Récupération des données dans le cache');
            Promise.resolve()
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue person', loadingText);
                return getCacheItemDefaultValue('person', []);
              })
              .then((persons) => setPersons([...persons]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue group', loadingText);
                return getCacheItemDefaultValue('group', []);
              })
              .then((groups) => setGroups([...groups]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue report', loadingText);
                return getCacheItemDefaultValue('report', []);
              })
              .then((reports) => setReports([...reports]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue passage', loadingText);
                return getCacheItemDefaultValue('passage', []);
              })
              .then((passages) => setPassages([...passages]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue rencontre', loadingText);
                return getCacheItemDefaultValue('rencontre', []);
              })
              .then((rencontres) => setRencontres([...rencontres]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue action', loadingText);
                return getCacheItemDefaultValue('action', []);
              })
              .then((actions) => setActions([...actions]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue territory', loadingText);
                return getCacheItemDefaultValue('territory', []);
              })
              .then((territories) => setTerritories([...territories]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue place', loadingText);
                return getCacheItemDefaultValue('place', []);
              })
              .then((places) => setPlaces([...places]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue relPersonPlace', loadingText);
                return getCacheItemDefaultValue('relPersonPlace', []);
              })
              .then((relsPersonPlace) => setRelsPersonPlace([...relsPersonPlace]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue observation', loadingText);
                return getCacheItemDefaultValue('territory-observation', []);
              })
              .then((territoryObservations) => setTerritoryObservations([...territoryObservations]))
              .then(() => {
                console.log(Date.now() - startLoadingDate, 'getCacheItemDefaultValue comment', loadingText);
                return getCacheItemDefaultValue('comment', []);
              })
              .then((comments) => setComments([...comments]))
              .then(() => startLoader(newList, itemsCount));
          });
        });
    } else if (shouldStop) stopLoader();
  }

  // Fetch data from API, handle loader progress.
  async function fetchData() {
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
      console.log(Date.now() - startLoadingDate, 'get persons', loadingText);
      setLoadingText('Chargement des personnes');
      const res = await API.get({ path: '/person', query });
      console.log(Date.now() - startLoadingDate, 'got persons', loadingText);
      if (!res.data) return resetLoaderOnError();
      setPersons(
        res.hasMore
          ? mergeItems(persons, res.decryptedData)
          : mergeItems(persons, res.decryptedData)
              .map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt }))
              .sort((p1, p2) => (p1.name || '').localeCompare(p2.name || ''))
      );
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'group') {
      setLoadingText('Chargement des familles');
      const res = await API.get({ path: '/group', query });
      if (!res.data) return resetLoaderOnError();
      setGroups(() => {
        const mergedItems = mergeItems(groups, res.decryptedData);
        if (res.hasMore) return mergedItems;
        if (mergedItems.length > groups.length) {
          return mergedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return mergedItems;
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'consultation') {
      setLoadingText('Chargement des consultations');
      const res = await API.get({ path: '/consultation', query: { ...query, after: initialLoad ? 0 : lastLoad } });
      if (!res.data) return resetLoaderOnError();
      setConsultations(
        res.hasMore ? mergeItems(consultations, res.decryptedData) : mergeItems(consultations, res.decryptedData).map(formatConsultation)
      );
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'treatment') {
      setLoadingText('Chargement des traitements');
      const res = await API.get({ path: '/treatment', query: { ...query, after: initialLoad ? 0 : lastLoad } });
      if (!res.data) return resetLoaderOnError();
      setTreatments(mergeItems(treatments, res.decryptedData));
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'medicalFile') {
      setLoadingText('Chargement des fichiers médicaux');
      const res = await API.get({ path: '/medical-file', query: { ...query, after: initialLoad ? 0 : lastLoad } });
      if (!res.data) return resetLoaderOnError();
      setMedicalFiles(mergeItems(medicalFiles, res.decryptedData));
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'report') {
      setLoadingText('Chargement des rapports');
      const res = await API.get({ path: '/report', query });
      if (!res.data) return resetLoaderOnError();
      setReports(
        res.hasMore
          ? mergeItems(reports, res.decryptedData)
          : mergeItems(reports, res.decryptedData)
              // This line should be removed when `clean-reports-with-no-team-nor-date` migration has run on all organisations.
              .filter((r) => !!r.team && !!r.date)
      );
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'passage') {
      setLoadingText('Chargement des passages');
      const res = await API.get({ path: '/passage', query });
      if (!res.data) return resetLoaderOnError();
      setPassages(() => {
        const mergedItems = mergeItems(passages, res.decryptedData);
        if (res.hasMore) return mergedItems;
        return mergedItems.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'rencontre') {
      setLoadingText('Chargement des rencontres');
      const res = await API.get({ path: '/rencontre', query });
      if (!res.data) return resetLoaderOnError();
      setRencontres(() => {
        const mergedItems = mergeItems(rencontres, res.decryptedData);
        if (res.hasMore) return mergedItems;
        return mergedItems.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'action') {
      setFullScreen(false);
      setLoadingText('Chargement des actions');
      const res = await API.get({ path: '/action', query });
      if (!res.data) return resetLoaderOnError();
      setActions(mergeItems(actions, res.decryptedData));
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'territory') {
      setLoadingText('Chargement des territoires');
      const res = await API.get({ path: '/territory', query });
      if (!res.data) return resetLoaderOnError();
      setTerritories(() => {
        const mergedItems = mergeItems(territories, res.decryptedData);
        if (res.hasMore) return mergedItems;
        return mergedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'place') {
      setLoadingText('Chargement des lieux');
      const res = await API.get({ path: '/place', query });
      if (!res.data) return resetLoaderOnError();
      setPlaces(() => {
        const mergedItems = mergeItems(places, res.decryptedData);
        if (res.hasMore) return mergedItems;
        return mergedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'relsPersonPlace') {
      setLoadingText('Chargement des relations personne-lieu');
      const res = await API.get({ path: '/relPersonPlace', query });
      if (!res.data) return resetLoaderOnError();
      setRelsPersonPlace(() => {
        const mergedItems = mergeItems(relsPersonPlace, res.decryptedData);
        if (res.hasMore) return mergedItems;
        return mergedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'territoryObservation') {
      setLoadingText('Chargement des observations de territoire');
      const res = await API.get({ path: '/territory-observation', query });
      if (!res.data) return resetLoaderOnError();
      setTerritoryObservations(() => {
        const mergedItems = mergeItems(territoryObservations, res.decryptedData);
        if (res.hasMore) return mergedItems;
        return mergedItems.sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt));
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    } else if (current === 'comment') {
      setLoadingText('Chargement des commentaires');
      const res = await API.get({ path: '/comment', query });
      if (!res.data) return resetLoaderOnError();
      setComments(() => {
        const mergedItems = mergeItems(comments, res.decryptedData);
        if (res.hasMore) return mergedItems;
        return mergedItems.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      });
      handleMore(res.hasMore);
      setProgressBuffer(res.data.length);
    }
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
    console.timeEnd('load text');
    console.log(loadingText);
  }

  async function resetLoaderOnError() {
    // an error was thrown, the data was not downloaded,
    // this can result in data corruption, we need to reset the loader
    await clearCache();
    setLastLoad(0);
    toast.error('Désolé, une erreur est survenue lors du chargement de vos données, veuillez réessayer', {
      onClose: () => window.location.replace('/auth'),
      autoClose: 5000,
    });
  }

  function updateProgress() {
    if (!loadList.list.length) return;

    if (progressBuffer !== null) {
      setProgress((progress || 0) + progressBuffer);
      setProgressBuffer(null);
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
    setIsLoading(true);
    setFullScreen(false);
    setInitialLoad(false);
    setLoaderTrigger(true);
    setLoadingText('Mise à jour des données');
    startLoadingDate = Date.now();
  }
  function load() {
    setIsLoading(true);
    setFullScreen(true);
    setInitialLoad(true);
    setLoaderTrigger(true);
    setLoadingText('Chargement des données');
    startLoadingDate = Date.now();
  }

  async function resetCache() {
    await clearCache();
    setLastLoad(0);
  }

  return {
    refresh,
    load,
    resetCache,
    isLoading: Boolean(isLoading),
    isFullScreen: Boolean(fullScreen),
  };
}

export const mergeItems = (oldItems, newItems = []) => {
  const newItemsIds = newItems?.map((i) => i._id) || [];
  const oldItemsPurged = oldItems.filter((i) => !newItemsIds.includes(i._id));
  return [...oldItemsPurged, ...newItems].filter((e) => !e.deletedAt);
};

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
