import { useEffect } from 'react';
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

const isLoadingState = atom({ key: 'isLoadingState', default: false });
const initialLoadState = atom({ key: 'isInitialLoadState', default: false });
const fullScreenState = atom({ key: 'fullScreenState', default: true });
const progressState = atom({ key: 'progressState', default: null });
const totalState = atom({ key: 'totalState', default: null });
export const initialLoadingTextState = 'En attente de chargement';
export const loadingTextState = atom({ key: 'loadingTextState', default: initialLoadingTextState });
export const lastLoadState = atom({
  key: 'lastLoadState',
  default: null,
  effects: [
    ({ onSet }) => {
      onSet(async (newValue) => {
        await setCacheItem(dashboardCurrentCacheKey, newValue);
      });
    },
  ],
});

export default function DataLoader() {
  const isLoading = useRecoilValue(isLoadingState);
  const fullScreen = useRecoilValue(fullScreenState);
  const loadingText = useRecoilValue(loadingTextState);
  const progress = useRecoilValue(progressState);
  const total = useRecoilValue(totalState);

  if (!isLoading) return <RandomPicturePreloader />;
  if (!total && !fullScreen) return null;

  if (fullScreen) {
    return (
      <div className="tw-absolute tw-inset-0 tw-z-[1000] tw-box-border tw-flex tw-w-full tw-items-center tw-justify-center tw-bg-white">
        <div className="tw-flex tw-h-[50vh] tw-max-h-[50vw] tw-w-[50vw] tw-max-w-[50vh] tw-flex-col tw-items-center tw-justify-center">
          <RandomPicture />
          <ProgressBar progress={progress} total={total} loadingText={loadingText} />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-absolute tw-top-0 tw-left-0 tw-z-[1000] tw-box-border tw-w-full">
      <ProgressBar progress={progress} total={total} loadingText={loadingText} />
    </div>
  );
}

export function useDataLoader(options = { refreshOnMount: false }) {
  const [fullScreen, setFullScreen] = useRecoilState(fullScreenState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [initialLoad, setInitialLoad] = useRecoilState(initialLoadState);
  const setLoadingText = useSetRecoilState(loadingTextState);
  const setLastLoad = useSetRecoilState(lastLoadState);

  const setUser = useSetRecoilState(userState);
  const setOrganisation = useSetRecoilState(organisationState);
  const { migrateData } = useDataMigrator();

  const setPersons = useSetRecoilState(personsState);
  const setActions = useSetRecoilState(actionsState);
  const setConsultations = useSetRecoilState(consultationsState);
  const setTreatments = useSetRecoilState(treatmentsState);
  const setMedicalFiles = useSetRecoilState(medicalFileState);
  const setPassages = useSetRecoilState(passagesState);
  const setRencontres = useSetRecoilState(rencontresState);
  const setReports = useSetRecoilState(reportsState);
  const setTerritories = useSetRecoilState(territoriesState);
  const setPlaces = useSetRecoilState(placesState);
  const setRelsPersonPlace = useSetRecoilState(relsPersonPlaceState);
  const setTerritoryObservations = useSetRecoilState(territoryObservationsState);
  const setComments = useSetRecoilState(commentsState);
  const setGroups = useSetRecoilState(groupsState);
  const setProgress = useSetRecoilState(progressState);
  const setTotal = useSetRecoilState(totalState);

  useEffect(function refreshOnMountEffect() {
    if (options.refreshOnMount && !isLoading) loadOrRefreshData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrRefreshData(isStartingInitialLoad) {
    setIsLoading(true);
    setFullScreen(isStartingInitialLoad ? true : false);
    setInitialLoad(isStartingInitialLoad ? true : false);
    setLoadingText(setInitialLoad ? 'Chargement des données' : 'Mise à jour des données');

    /*
    Refresh organisation (and user), to get the latest organisation fields
    and the latest user roles
  */
    const userResponse = await API.get({ path: '/user/me' });
    if (!userResponse.ok) return resetLoaderOnError();
    const latestOrganisation = userResponse.user.organisation;
    const latestUser = userResponse.user;
    const organisationId = latestOrganisation._id;
    setOrganisation(latestOrganisation);
    setUser(latestUser);
    // Get date from server at the very beginning of the loader.
    const serverDateResponse = await API.get({ path: '/now' });
    const serverDate = serverDateResponse.data;
    if (initialLoad) {
      await migrateData();
    }
    const lastLoadValueCached = await getCacheItem(dashboardCurrentCacheKey);
    const lastLoadValue = lastLoadValueCached || 0;
    setLastLoad(lastLoadValue);

    const statsResponse = await API.get({
      path: '/organisation/stats',
      query: {
        organisation: organisationId,
        after: lastLoadValue,
        withDeleted: true,
        // Medical data is never saved in cache so we always have to download all at every page reload.
        withAllMedicalData: initialLoad,
      },
    });

    if (!statsResponse.ok) return false;
    const stats = statsResponse.data;
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

    setProgress(0);
    setTotal(itemsCount);

    const query = {
      organisation: organisationId,
      limit: String(10000),
      after: lastLoadValue,
      withDeleted: Boolean(lastLoadValue),
    };

    if (stats.persons > 0) {
      setLoadingText('Chargement des personnes');
      const cachedPersons = await getCacheItemDefaultValue('person', []);
      setPersons([...cachedPersons]);
      async function loadPersons(page = 0) {
        const res = await API.get({ path: '/person', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setPersons((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadPersons(page + 1);
        return true;
      }
      const personSuccess = await loadPersons(0);
      if (!personSuccess) return false;
    }
    if (stats.groups > 0) {
      setLoadingText('Chargement des familles');
      const cachedGroups = await getCacheItemDefaultValue('group', []);
      setGroups([...cachedGroups]);
      async function loadGroups(page = 0) {
        const res = await API.get({ path: '/group', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setGroups((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadGroups(page + 1);
        return true;
      }
      const groupsSuccess = await loadGroups(0);
      if (!groupsSuccess) return false;
    }
    if (stats.reports > 0) {
      setLoadingText('Chargement des comptes-rendus');
      const cachedReports = await getCacheItemDefaultValue('report', []);
      setReports([...cachedReports]);
      async function loadReports(page = 0) {
        const res = await API.get({ path: '/report', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setReports((items) => mergeItems(items, res.decryptedData, { filterNewItemsFunction: (r) => !!r.team && !!r.date }));
        if (res.hasMore) return loadReports(page + 1);
        return true;
      }
      const reportsSuccess = await loadReports(0);
      if (!reportsSuccess) return false;
    }
    if (stats.passages > 0) {
      setLoadingText('Chargement des passages');
      const cachedPassages = await getCacheItemDefaultValue('passage', []);
      setPassages([...cachedPassages]);
      async function loadPassages(page = 0) {
        const res = await API.get({ path: '/passage', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setPassages((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadPassages(page + 1);
        return true;
      }
      const passagesSuccess = await loadPassages(0);
      if (!passagesSuccess) return false;
    }
    if (stats.rencontres > 0) {
      setLoadingText('Chargement des rencontres');
      const cachedRencontres = await getCacheItemDefaultValue('rencontre', []);
      setRencontres([...cachedRencontres]);
      async function loadRencontres(page = 0) {
        const res = await API.get({ path: '/rencontre', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setRencontres((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadRencontres(page + 1);
        return true;
      }
      const rencontresSuccess = await loadRencontres(0);
      if (!rencontresSuccess) return false;
    }
    if (stats.actions > 0) {
      setLoadingText('Chargement des actions');
      const cachedActions = await getCacheItemDefaultValue('action', []);
      setActions([...cachedActions]);
      async function loadActions(page = 0) {
        const res = await API.get({ path: '/action', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setActions((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadActions(page + 1);
        return true;
      }
      const actionsSuccess = await loadActions(0);
      if (!actionsSuccess) return false;
    }
    if (stats.territories > 0) {
      setLoadingText('Chargement des territoires');
      const cachedTerritories = await getCacheItemDefaultValue('territory', []);
      setTerritories([...cachedTerritories]);
      async function loadTerritories(page = 0) {
        const res = await API.get({ path: '/territory', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setTerritories((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadTerritories(page + 1);
        return true;
      }
      const territoriesSuccess = await loadTerritories(0);
      if (!territoriesSuccess) return false;
    }
    if (stats.places > 0) {
      setLoadingText('Chargement des lieux');
      const cachedPlaces = await getCacheItemDefaultValue('place', []);
      setPlaces([...cachedPlaces]);
      async function loadPlaces(page = 0) {
        const res = await API.get({ path: '/place', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setPlaces((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadPlaces(page + 1);
        return true;
      }
      const placesSuccess = await loadPlaces(0);
      if (!placesSuccess) return false;
    }
    if (stats.relsPersonPlace > 0) {
      setLoadingText('Chargement des relations personne-lieu');
      const cachedRelPersonPlace = await getCacheItemDefaultValue('relPersonPlace', []);
      setRelsPersonPlace([...cachedRelPersonPlace]);
      async function loadRelPersonPlaces(page = 0) {
        const res = await API.get({ path: '/relPersonPlace', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setRelsPersonPlace((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadRelPersonPlaces(page + 1);
        return true;
      }
      const relsPersonPlacesSuccess = await loadRelPersonPlaces(0);
      if (!relsPersonPlacesSuccess) return false;
    }
    if (stats.territoryObservations > 0) {
      setLoadingText('Chargement des observations de territoire');
      const cachedObservations = await getCacheItemDefaultValue('territory-observation', []);
      setTerritoryObservations([...cachedObservations]);
      async function loadObservations(page = 0) {
        const res = await API.get({ path: '/territory-observation', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setTerritoryObservations((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadObservations(page + 1);
        return true;
      }
      const territoryObservationsSuccess = await loadObservations(0);
      if (!territoryObservationsSuccess) return false;
    }
    if (stats.comments > 0) {
      setLoadingText('Chargement des commentaires');
      const cachedComments = await getCacheItemDefaultValue('comment', []);
      setComments([...cachedComments]);
      async function loadComments(page = 0) {
        const res = await API.get({ path: '/comment', query: { ...query, page: String(page) } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setComments((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadComments(page + 1);
        return true;
      }
      const commentsSuccess = await loadComments(0);
      if (!commentsSuccess) return false;
    }
    if (stats.consultations > 0) {
      setLoadingText('Chargement des consultations');
      async function loadConsultations(page = 0) {
        const res = await API.get({ path: '/consultation', query: { ...query, page: String(page), after: initialLoad ? 0 : lastLoadValue } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setConsultations((items) => mergeItems(items, res.decryptedData, { formatNewItemsFunction: formatConsultation }));
        if (res.hasMore) return loadConsultations(page + 1);
        return true;
      }
      const consultationsSuccess = await loadConsultations(0);
      if (!consultationsSuccess) return false;
    }
    if (stats.treatments > 0) {
      setLoadingText('Chargement des traitements');
      async function loadTreatments(page = 0) {
        const res = await API.get({ path: '/treatment', query: { ...query, page: String(page), after: initialLoad ? 0 : lastLoadValue } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setTreatments((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadTreatments(page + 1);
        return true;
      }
      const treatmentsSuccess = await loadTreatments(0);
      if (!treatmentsSuccess) return false;
    }
    if (stats.medicalFiles > 0) {
      setLoadingText('Chargement des fichiers médicaux');
      async function loadMedicalFiles(page = 0) {
        const res = await API.get({ path: '/medical-file', query: { ...query, page: String(page), after: initialLoad ? 0 : lastLoadValue } });
        if (!res.ok || !res.data.length) return resetLoaderOnError();
        setProgress((p) => p + res.data.length);
        setMedicalFiles((items) => mergeItems(items, res.decryptedData));
        if (res.hasMore) return loadMedicalFiles(page + 1);
        return true;
      }
      const medicalFilesSuccess = await loadMedicalFiles(0);
      if (!medicalFilesSuccess) return false;
    }

    setIsLoading(false);
    setLastLoad(serverDate);
    setLoadingText('En attente de chargement');
    setProgress(null);
    setTotal(null);
    return true;
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
    return false;
  }

  async function resetCache() {
    await clearCache();
    setLastLoad(0);
  }

  return {
    refresh: () => loadOrRefreshData(false),
    startInitialLoad: () => loadOrRefreshData(true),
    resetCache,
    isLoading: Boolean(isLoading),
    isFullScreen: Boolean(fullScreen),
  };
}

export function mergeItems(oldItems, newItems = [], { formatNewItemsFunction, filterNewItemsFunction } = {}) {
  const newItemsCleanedAndFormatted = [];
  const newItemIds = {};

  for (const newItem of newItems) {
    newItemIds[newItem._id] = true;
    if (newItem.deletedAt) continue;
    if (filterNewItemsFunction) {
      if (!filterNewItemsFunction(newItem)) continue;
    }
    if (formatNewItemsFunction) {
      newItemsCleanedAndFormatted.push(formatNewItemsFunction(newItem));
    } else {
      newItemsCleanedAndFormatted.push(newItem);
    }
  }

  const oldItemsPurged = [];
  for (const oldItem of oldItems) {
    if (oldItem.deletedAt) continue;
    if (!newItemIds[oldItem._id]) {
      oldItemsPurged.push(oldItem);
    }
  }

  return [...oldItemsPurged, ...newItemsCleanedAndFormatted];
}
