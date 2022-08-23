import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { getCacheItem, getData, setCacheItem } from '../services/dataManagement';
import { organisationState, userState } from '../recoil/auth';
import { actionsState } from '../recoil/actions';
import { personsState } from '../recoil/persons';
import { territoriesState } from '../recoil/territory';
import { placesState } from '../recoil/places';
import { relsPersonPlaceState } from '../recoil/relPersonPlace';
import { territoryObservationsState } from '../recoil/territoryObservations';
import { commentsState } from '../recoil/comments';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../services/api';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import dayjs from 'dayjs';
import { passagesState } from '../recoil/passages';
import { consultationsState, whitelistAllowedData } from '../recoil/consultations';
import { treatmentsState } from '../recoil/treatments';
import { medicalFileState } from '../recoil/medicalFiles';
import { RandomPicture, RandomPicturePreloader } from './LoaderRandomPicture';
import ProgressBar from './LoaderProgressBar';

// Update to flush cache.
const currentCacheKey = 'mano-last-refresh-2022-05-30';

export const loadingState = atom({
  key: 'loadingState',
  default: '',
});

const collections = [
  'person',
  'report',
  'action',
  'territory',
  'place',
  'relPersonPlace',
  'territory-observation',
  'comment',
  'passage',
  'consultation',
  'treatment',
  'medical-file',
];
export const collectionsToLoadState = atom({
  key: 'collectionsToLoadState',
  default: collections,
});

const progressState = atom({
  key: 'progressState',
  default: 0,
});

export const loaderFullScreenState = atom({
  key: 'loaderFullScreenState',
  default: false,
});

export const refreshTriggerState = atom({
  key: 'refreshTriggerState',
  default: {
    status: false,
    options: { showFullScreen: false, initialLoad: false },
  },
});

export const lastRefreshState = atom({
  key: 'lastRefreshState',
  default: null,
  effects: [
    ({ onSet }) => {
      onSet(async (newValue) => {
        await setCacheItem(currentCacheKey, newValue);
      });
    },
  ],
});

export const useRefreshOnMount = () => {
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  useEffect(() => {
    if (refreshTrigger.status === true) return;
    setRefreshTrigger({
      status: true,
      options: { showFullScreen: false, initialLoad: false },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const mergeItems = (oldItems, newItems, initialLoad) => {
  if (initialLoad) return [...oldItems, ...newItems];
  const newItemsIds = newItems.map((i) => i._id);
  const oldItemsPurged = oldItems.filter((i) => !newItemsIds.includes(i._id));
  return [...oldItemsPurged, ...newItems];
};

const Loader = () => {
  const API = useApi();
  const [lastRefresh, setLastRefresh] = useRecoilState(lastRefreshState);
  const [lastRefreshReady, setLastRefreshReady] = useState(false);
  const [loading, setLoading] = useRecoilState(loadingState);
  const setCollectionsToLoad = useSetRecoilState(collectionsToLoadState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [fullScreen, setFullScreen] = useRecoilState(loaderFullScreenState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const user = useRecoilValue(userState);
  const organisationId = organisation?._id;

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
  const [territoryObservations, setTerritoryObs] = useRecoilState(territoryObservationsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);

  useEffect(() => {
    if (lastRefreshReady) return;
    (async () => {
      setLastRefresh((await getCacheItem(currentCacheKey)) || 0);
      setLastRefreshReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRefreshReady]);

  const migrationIsDone = (updatedOrganisation) => {
    setOrganisation(updatedOrganisation);
    /* FIXME ?:
    the `setOrganisation(response.organisation)` doesn't provide an updated version of `organisation`
     for the rest of this `refresh` function
     neither for the `useApi` hook
     therefore, a new organisation with no `migrationLastUpdateAt` won't be able to do the multiple migrations
     because server side, `!!organisation.migrationLastUpdateAt === true` but `req.query.migrationLastUpdateAt === null`
     so we need to end the refresh after each migration, and restart it with the fresh organisation
    */
    setRefreshTrigger((oldRefreshState) => ({
      ...oldRefreshState,
      status: false,
    }));
    setRefreshTrigger((oldRefreshState) => ({
      ...oldRefreshState,
      status: true,
    }));
  };

  const refresh = async () => {
    const { showFullScreen, initialLoad } = refreshTrigger.options;
    setFullScreen(showFullScreen);
    setLoading(initialLoad ? 'Chargement...' : 'Mise à jour...');

    /*
    Play organisation internal migrations (things that requires the database to be fully loaded locally).
    */

    if (!organisation.migrations?.includes('reports-from-real-date-to-date-id')) {
      await new Promise((res) => setTimeout(res, 500));
      setLoading('Mise à jour des données de votre organisation, veuillez patienter quelques instants...');
      const allReports = await getData({
        collectionName: 'report',
        data: reports,
        isInitialization: true,
        withDeleted: false,
        setBatchData: (newReports) => {
          newReports = newReports.filter((r) => !!r.team && !!r.date);
          setReports((oldReports) => [...oldReports, ...newReports]);
        },
        API,
      });

      const reportsToMigrate = allReports
        .filter((r) => !!r.date)
        .map((report) => ({
          ...report,
          date: dayjs(report.date).format('YYYY-MM-DD'),
          oldDateSystem: report.date, // just to track if we did bad stuff
        }));
      const encryptedReportsToMigrate = await Promise.all(reportsToMigrate.map(prepareReportForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const response = await API.put({
        path: `/migration/reports-from-real-date-to-date-id`,
        body: {
          reportsToMigrate: encryptedReportsToMigrate,
        },
      });
      if (response.ok) return migrationIsDone(response.organisation);
      if (response.error) {
        setLoading(response.error);
        setProgress(1);
      }
      return;
    }

    if (!organisation.migrations?.includes('clean-reports-with-no-team-nor-date')) {
      await new Promise((res) => setTimeout(res, 500));
      setLoading('Mise à jour des données de votre organisation, veuillez patienter quelques instants...');
      const allReports = await getData({
        collectionName: 'report',
        data: reports,
        isInitialization: true,
        withDeleted: false,
        saveInCache: false,
        setBatchData: (newReports) => setReports((oldReports) => [...oldReports, ...newReports]),
        API,
      });

      const reportIdsToDelete = allReports.filter((r) => !r.team || !r.date).map((r) => r._id);

      const response = await API.put({
        path: `/migration/clean-reports-with-no-team-nor-date`,
        body: {
          reportIdsToDelete,
        },
      });
      if (response.ok) return migrationIsDone(response.organisation);
      if (response.error) {
        setLoading(response.error);
        setProgress(1);
      }
      return;
    }

    /*
    Get number of data to download to show the appropriate loading progress bar
    */
    const response = await API.get({
      path: '/organisation/stats',
      query: {
        organisation: organisationId,
        after: lastRefresh,
        withDeleted: true,
        // Medical data is never saved in cache so we always have to download all at every page reload.
        withAllMedicalData: initialLoad,
      },
    });
    if (!response.ok) {
      setRefreshTrigger({
        status: false,
        options: { showFullScreen: false, initialLoad: false },
      });
      return;
    }

    let total =
      response.data.actions +
      response.data.persons +
      response.data.territories +
      response.data.territoryObservations +
      response.data.places +
      response.data.comments +
      response.data.passages +
      response.data.reports +
      response.data.relsPersonPlace +
      response.data.consultations +
      response.data.treatments +
      response.data.medicalFiles;

    if (initialLoad) {
      total = total + collections.length; // for the progress bar to be beautiful
    }

    if (!total) {
      // If nothing to load, just show a beautiful progress bar
      setLoading('');
      setProgress(1);
      await new Promise((res) => setTimeout(res, 500));
    }
    /*
    Get persons
    */
    if (response.data.persons || initialLoad) {
      setLoading('Chargement des personnes');
      const refreshedPersons = await getData({
        collectionName: 'person',
        data: persons,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPersons) => setPersons((oldPersons) => mergeItems(oldPersons, newPersons, initialLoad)),
        API,
      });
      if (refreshedPersons)
        setPersons(
          refreshedPersons
            .map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt }))
            .sort((p1, p2) => (p1.name || '').localeCompare(p2.name || ''))
        );
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'person'));
    /*
    Get consultations
    */
    if (['admin', 'normal'].includes(user.role) && (response.data.consultations || initialLoad)) {
      setLoading('Chargement des consultations');
      const refreshedConsultations = await getData({
        collectionName: 'consultation',
        data: consultations,
        isInitialization: initialLoad,
        withDeleted: true,
        saveInCache: false,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh: initialLoad ? 0 : lastRefresh, // because we never save medical data in cache
        setBatchData: (newConsultations) =>
          setConsultations((oldConsultations) =>
            mergeItems(
              oldConsultations,
              newConsultations.map((c) => whitelistAllowedData(c, user)),
              initialLoad
            )
          ),
        API,
      });
      if (refreshedConsultations) setConsultations(refreshedConsultations.map((c) => whitelistAllowedData(c, user)));
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'consultation'));

    // Only for healthcare professionals.
    if (['admin', 'normal'].includes(user.role) && user.healthcareProfessional) {
      /*
      Get treatments
      */
      if (response.data.treatments || initialLoad) {
        setLoading('Chargement des traitements');
        const refreshedTreatments = await getData({
          collectionName: 'treatment',
          data: treatments,
          isInitialization: initialLoad,
          withDeleted: true,
          saveInCache: false,
          setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
          lastRefresh: initialLoad ? 0 : lastRefresh, // because we never save medical data in cache
          setBatchData: (newTreatments) => setTreatments((oldTreatments) => mergeItems(oldTreatments, newTreatments, initialLoad)),
          API,
        });
        if (refreshedTreatments) setTreatments(refreshedTreatments);
      }
      setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'treatment'));
      /*
      Get medicalFiles
      */
      if (response.data.medicalFiles || initialLoad) {
        setLoading('Chargement des informations médicales');
        const refreshedMedicalFiles = await getData({
          collectionName: 'medical-file',
          data: medicalFiles,
          isInitialization: initialLoad,
          withDeleted: true,
          saveInCache: false,
          setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
          lastRefresh: initialLoad ? 0 : lastRefresh, // because we never save medical data in cache
          setBatchData: (newMedicalFiles) => setMedicalFiles((oldMedicalFiles) => mergeItems(oldMedicalFiles, newMedicalFiles, initialLoad)),
          API,
        });
        if (refreshedMedicalFiles) setMedicalFiles(refreshedMedicalFiles);
      }
      setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'medical-file'));
    }
    /*
    Get reports
    */
    /*
    NOTA:
    From commit ef6e2751 (2022/02/08) until commit d76fcc35 (2022/02/25), commit of full encryption
    we had a bug where no encryption was save on report creation
    (https://github.com/SocialGouv/mano/blob/ef6e2751ce02f6f34933cf2472492b1d5cd028d6/api/src/controllers/report.js#L67)
    therefore, no date nor team was encryptely saved and those reports are just pollution
    TODO: migration to delete all those reports from each organisation
    QUICK WIN: filter those reports from recoil state
    */

    if (response.data.reports || initialLoad) {
      setLoading('Chargement des comptes-rendus');
      const refreshedReports = await getData({
        collectionName: 'report',
        data: reports,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newReports) => {
          newReports = newReports.filter((r) => !!r.team && !!r.date);
          setReports((oldReports) => mergeItems(oldReports, newReports, initialLoad));
        },
        API,
      });
      if (refreshedReports)
        setReports(refreshedReports.filter((r) => !!r.team && !!r.date).sort((r1, r2) => (dayjs(r1.date).isBefore(dayjs(r2.date), 'day') ? 1 : -1)));
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'report'));

    /*
    Get passages
    */
    if (response.data.passages || initialLoad) {
      setLoading('Chargement des passages');
      const refreshedPassages = await getData({
        collectionName: 'passage',
        data: passages,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPassages) => setPassages((oldPassages) => mergeItems(oldPassages, newPassages, initialLoad)),
        API,
      });
      if (refreshedPassages) setPassages(refreshedPassages.sort((r1, r2) => (dayjs(r1.date).isBefore(dayjs(r2.date), 'day') ? 1 : -1)));
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'passage'));
    /*
    Switch to not full screen
    */
    setFullScreen(false);

    /*
    Get actions
    */
    if (response.data.actions || initialLoad) {
      setLoading('Chargement des actions');
      const refreshedActions = await getData({
        collectionName: 'action',
        data: actions,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newActions) => setActions((oldActions) => mergeItems(oldActions, newActions, initialLoad)),
        API,
      });
      if (refreshedActions) setActions(refreshedActions);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'action'));
    /*
    Get territories
    */
    if (response.data.territories || initialLoad) {
      setLoading('Chargement des territoires');
      const refreshedTerritories = await getData({
        collectionName: 'territory',
        data: territories,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newTerritories) => setTerritories((oldTerritories) => mergeItems(oldTerritories, newTerritories, initialLoad)),
        API,
      });
      if (refreshedTerritories) setTerritories(refreshedTerritories);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'territory'));

    /*
    Get places
    */
    if (response.data.places || initialLoad) {
      setLoading('Chargement des lieux');
      const refreshedPlaces = await getData({
        collectionName: 'place',
        data: places,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPlaces) => setPlaces((oldPlaces) => mergeItems(oldPlaces, newPlaces, initialLoad)),
        API,
      });
      if (refreshedPlaces) setPlaces(refreshedPlaces.sort((p1, p2) => p1.name.localeCompare(p2.name)));
    }
    if (response.data.relsPersonPlace || initialLoad) {
      const refreshedRelPersonPlaces = await getData({
        collectionName: 'relPersonPlace',
        data: relsPersonPlace,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newRelPerPlace) => setRelsPersonPlace((oldRelPerPlace) => mergeItems(oldRelPerPlace, newRelPerPlace, initialLoad)),
        API,
      });
      if (refreshedRelPersonPlaces) setRelsPersonPlace(refreshedRelPersonPlaces);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'place'));
    /*
    Get observations territories
    */
    if (response.data.territoryObservations || initialLoad) {
      setLoading('Chargement des observations');
      const refreshedObs = await getData({
        collectionName: 'territory-observation',
        data: territoryObservations,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newObs) => setTerritoryObs((oldObs) => mergeItems(oldObs, newObs, initialLoad)),
        API,
      });
      if (refreshedObs) setTerritoryObs(refreshedObs);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'territory-observation'));
    /*
    Get comments
    */
    if (response.data.comments || initialLoad) {
      setLoading('Chargement des commentaires');
      const refreshedComments = await getData({
        collectionName: 'comment',
        data: comments,
        isInitialization: initialLoad,
        withDeleted: Boolean(lastRefresh),
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newComments) => setComments((oldComments) => mergeItems(oldComments, newComments, initialLoad)),
        API,
      });
      if (refreshedComments) setComments(refreshedComments);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'comment'));

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

  useEffect(() => {
    if (!(refreshTrigger.status === true && lastRefreshReady)) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger.status, lastRefreshReady]);

  if (!loading) return <RandomPicturePreloader />;
  if (fullScreen) {
    return (
      <FullScreenContainer>
        <InsideContainer>
          <RandomPicture />
          <ProgressBar progress={progress} loadingText={loading} />
        </InsideContainer>
      </FullScreenContainer>
    );
  }

  return (
    <Container>
      <ProgressBar progress={progress} loadingText={loading} />
    </Container>
  );
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

export default Loader;
