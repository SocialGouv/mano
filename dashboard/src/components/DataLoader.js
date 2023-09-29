import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
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

const cacheEffect = ({ onSet }) => {
  onSet(async (newValue) => {
    await setCacheItem(dashboardCurrentCacheKey, newValue);
  });
};

const loaderTriggerState = atom({ key: 'loaderTriggerState', default: false });
const isLoadingState = atom({ key: 'isLoadingState', default: false });
const initialLoadState = atom({ key: 'isInitialLoadState', default: false });
const fullScreenState = atom({ key: 'fullScreenState', default: true });
const checkDataConsistencyAtom = atom({ key: 'checkDataConsistencyAtom', default: 'idle' }); // 'idle' | 'checking' | 'unconsistent'
export const lastLoadState = atom({ key: 'lastLoadState', default: null, effects: [cacheEffect] });
export const initialLoadingTextState = 'En attente de chargement';
export const loadingTextState = atom({ key: 'loadingTextState', default: initialLoadingTextState });

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
  const [checkDataConsistencyState, setDataConsistencyState] = useRecoilState(checkDataConsistencyAtom);
  const [initialLoad, setInitialLoad] = useRecoilState(initialLoadState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const [loadList, setLoadList] = useState({ list: [], offset: 0 });
  const [progressBuffer, setProgressBuffer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [total, setTotal] = useState(null);

  useEffect(() => {
    initLoader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLoad, progress, total, loaderTrigger, loadList.list.length, isLoading]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadList]);
  useEffect(() => {
    updateProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, progressBuffer, loadList.list.length]);
  useEffect(() => {
    if (checkDataConsistencyState === 'checking') checkDataConsistency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkDataConsistencyState]);

  const organisationId = organisation?._id;

  const serverDate = useRef(null);

  // Loader initialization: get data from cache, check stats, init recoils states, and start loader.
  function initLoader() {
    if (loadList.list.length > 0) return;

    const shouldStart = progress === null && total === null && loaderTrigger && isLoading;
    const shouldStop = progress !== null && total !== null && isLoading;

    if (shouldStart) {
      console.log('START FUCKING SHIT initialLoad', initialLoad);
      Promise.resolve()
        .then(async () => {
          /*
            Refresh organisation (and user), to get the latest organisation fields
            and the latest user roles
          */
          const userResponse = await API.get({ path: '/user/me' });
          if (!userResponse.ok) return resetLoaderOnError();
          setOrganisation(userResponse.user.organisation);
          setUser(userResponse.user);
          // Get date from server at the very beginning of the loader.
          const serverDateResponse = await API.get({ path: '/now' });
          serverDate.current = serverDateResponse.data;
        })
        .then(() => (initialLoad ? migrateData() : Promise.resolve()))
        .then(() => getCacheItem(dashboardCurrentCacheKey))
        .then((lastLoadValue) => {
          console.log('lastLoadValue', lastLoadValue);
          console.log('initialLoad', initialLoad);
          console.log({
            path: '/organisation/stats',
            query: {
              organisation: organisationId,
              after: lastLoadValue || 0,
              withDeleted: true,
              // Medical data is never saved in cache so we always have to download all at every page reload.
              withAllMedicalData: initialLoad,
            },
          });
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
            console.log('REFRESH stats', stats);
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
            if (stats.consultations) newList.push('consultation');
            if (['admin', 'normal'].includes(user.role)) {
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

            // In case this is not the initial load, we don't have to load from cache again.
            if (!initialLoad) {
              startLoader(newList, itemsCount);
              return;
            }

            setLoadingText('Récupération des données dans le cache');
            Promise.resolve()
              .then(() => getCacheItemDefaultValue('person', []))
              .then((persons) => setPersons([...persons]))
              .then(() => getCacheItemDefaultValue('group', []))
              .then((groups) => setGroups([...groups]))
              .then(() => getCacheItemDefaultValue('report', []))
              .then((reports) => setReports([...reports]))
              .then(() => getCacheItemDefaultValue('passage', []))
              .then((passages) => setPassages([...passages]))
              .then(() => getCacheItemDefaultValue('rencontre', []))
              .then((rencontres) => setRencontres([...rencontres]))
              .then(() => getCacheItemDefaultValue('action', []))
              .then((actions) => setActions([...actions]))
              .then(() => getCacheItemDefaultValue('territory', []))
              .then((territories) => setTerritories([...territories]))
              .then(() => getCacheItemDefaultValue('place', []))
              .then((places) => setPlaces([...places]))
              .then(() => getCacheItemDefaultValue('relPersonPlace', []))
              .then((relsPersonPlace) => setRelsPersonPlace([...relsPersonPlace]))
              .then(() => getCacheItemDefaultValue('territory-observation', []))
              .then((territoryObservations) => setTerritoryObservations([...territoryObservations]))
              .then(() => getCacheItemDefaultValue('comment', []))
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
      limit: String(10000),
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
    setLastLoad(serverDate.current);
    setLoadingText('En attente de chargement');
    setProgressBuffer(null);
    setProgress(null);
    setTotal(null);
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

  function checkDataConsistency() {
    setDataConsistencyState('idle'); // to not trigger effect loop
    Promise.resolve()
      .then(async () => {
        /*
            Refresh organisation (and user), to get the latest organisation fields
            and the latest user roles
          */
        const userResponse = await API.get({ path: '/user/me' });
        if (!userResponse.ok) return resetLoaderOnError();
        setOrganisation(userResponse.user.organisation);
        setUser(userResponse.user);
        // Get date from server at the very beginning of the loader.
        const serverDateResponse = await API.get({ path: '/now' });
        serverDate.current = serverDateResponse.data;
      })
      .then(() => {
        API.get({
          path: '/organisation/stats',
          query: {
            organisation: organisationId,
            after: 0,
            withDeleted: false,
            // Medical data is never saved in cache so we always have to download all at every page reload.
            withAllMedicalData: true,
          },
        }).then(({ data: stats }) => {
          console.log('stats', stats);
          if (!stats) return;

          let cacheIsInvalidated = false;

          setLoadingText('Récupération des données dans le cache');
          Promise.resolve()
            .then(() => getCacheItemDefaultValue('person', []))
            .then((cachedPersons) => {
              console.log('SAME Persons AS PREVIOUS', cachedPersons.length, stats.persons, persons.length);
              setPersons([...cachedPersons]);
              if (stats.persons !== cachedPersons.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('group', []))
            .then((cachedGroups) => {
              console.log('SAME groups AS PREVIOUS', cachedGroups.length, stats.groups, groups.length);
              setGroups([...cachedGroups]);
              if (stats.groups !== cachedGroups.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('report', []))
            .then((cachedReports) => {
              console.log('SAME cachedReports AS PREVIOUS', cachedReports.length, stats.reports, reports.length);
              setReports([...cachedReports]);
              if (stats.reports !== cachedReports.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('passage', []))
            .then((cachedPassages) => {
              console.log('SAME cachedPassages AS PREVIOUS', cachedPassages.length, stats.passages, passages.length);
              setPassages([...cachedPassages]);
              if (stats.passages !== cachedPassages.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('rencontre', []))
            .then((cachedRencontres) => {
              console.log('SAME cachedRencontres AS PREVIOUS', cachedRencontres.length, stats.rencontres, rencontres.length);
              setRencontres([...cachedRencontres]);
              if (stats.rencontres !== cachedRencontres.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('action', []))
            .then((cachedActions) => {
              console.log('SAME cachedActions AS PREVIOUS', cachedActions.length, stats.actions, actions.length);
              setActions([...cachedActions]);
              if (stats.actions !== cachedActions.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('territory', []))
            .then((cachedTerritories) => {
              console.log('SAME cachedTerritories AS PREVIOUS', cachedTerritories.length, stats.territories, territories.length);
              setTerritories([...cachedTerritories]);
              if (stats.territories !== cachedTerritories.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('place', []))
            .then((cachedPlaces) => {
              console.log('SAME cachedPlaces AS PREVIOUS', cachedPlaces.length, stats.places, places.length);
              setPlaces([...cachedPlaces]);
              if (stats.places !== cachedPlaces.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('relPersonPlace', []))
            .then((cachedRelsPersonPlace) => {
              console.log('SAME cachedRelsPersonPlace AS PREVIOUS', cachedRelsPersonPlace.length, stats.relsPersonPlace, relsPersonPlace.length);
              setRelsPersonPlace([...cachedRelsPersonPlace]);
              if (stats.relsPersonPlace !== cachedRelsPersonPlace.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('territory-observation', []))
            .then((cachedTerritoryObservations) => {
              console.log(
                'SAME cachedTerritoryObservations AS PREVIOUS',
                cachedTerritoryObservations.length,
                stats.territoryObservations,
                territoryObservations.length
              );
              setTerritoryObservations([...cachedTerritoryObservations]);
              if (stats.territoryObservations !== cachedTerritoryObservations.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => getCacheItemDefaultValue('comment', []))
            .then((cachedComments) => {
              console.log('SAME cachedComments AS PREVIOUS', cachedComments.length, stats.comments, comments.length);
              setComments([...cachedComments]);
              if (stats.comments !== cachedComments.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(() => {
              if (stats.consultations !== consultations.length) {
                cacheIsInvalidated = true;
              }
              if (stats.treatments !== treatments.length) {
                cacheIsInvalidated = true;
              }
              if (stats.medicalFiles !== medicalFiles.length) {
                cacheIsInvalidated = true;
              }
            })
            .then(async () => {
              console.log('cacheIsInvalidated', cacheIsInvalidated);
              if (cacheIsInvalidated) {
                await clearCache().then(() => {
                  // startInitialLoad
                  setLastLoad(0);
                  setIsLoading(true);
                  setFullScreen(true);
                  setInitialLoad(true);
                  setLoaderTrigger(true);
                  setLoadingText('Chargement des données');
                  setDataConsistencyState('idle');
                });
              } else {
                // refresh
                setIsLoading(true);
                setFullScreen(false);
                setInitialLoad(false);
                setLoaderTrigger(true);
                setLoadingText('Mise à jour des données');
              }
            });
        });
      });
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
  const setDataConsistencyState = useSetRecoilState(checkDataConsistencyAtom);

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
  }

  function startInitialLoad() {
    setIsLoading(true);
    setFullScreen(true);
    setInitialLoad(true);
    setLoaderTrigger(true);
    setLoadingText('Chargement des données');
  }

  async function resetCache() {
    setLastLoad(0);
    await clearCache();
  }

  async function checkDataConsistency() {
    setDataConsistencyState('checking');
  }

  return {
    refresh,
    startInitialLoad,
    resetCache,
    checkDataConsistency,
    isLoading: Boolean(isLoading),
    isFullScreen: Boolean(fullScreen),
  };
}

export const mergeItems = (oldItems, newItems = []) => {
  const newItemIds = {};
  for (const newItem of newItems) {
    newItemIds[newItem._id] = true;
  }
  const oldItemsPurged = oldItems.filter((item) => !newItemIds[item._id] && !item.deletedAt);
  return [...oldItemsPurged, ...newItems.filter((item) => !item.deletedAt)];
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
