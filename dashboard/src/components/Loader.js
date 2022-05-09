import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '../config';
import picture1 from '../assets/MANO_livraison_elements-07_green.png';
import picture2 from '../assets/MANO_livraison_elements-08_green.png';
import picture3 from '../assets/MANO_livraison_elements_Plan_de_travail_green.png';
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { getData, manoCacheStorage } from '../services/dataManagement';
import { organisationState, teamsState, userState } from '../recoil/auth';
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
import { passagesState, preparePassageForEncryption } from '../recoil/passages';
import { consultationsState, whitelistAllowedData } from '../recoil/consultations';
import { treatmentsState } from '../recoil/treatments';
import { medicalFileState } from '../recoil/medicalFiles';

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

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

export const lastRefreshState = atom({
  key: 'lastRefreshState',
  default: window.localStorage.getItem('mano-last-refresh-2022-04-26') || 0,
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        if (!!manoCacheStorage) {
          window.localStorage.setItem('mano-last-refresh-2022-04-26', newValue);
        } else {
          window.localStorage.removeItem('mano-last-refresh-2022-04-26');
        }
      });
    },
  ],
});

const mergeItems = (oldItems, newItems) => {
  const newItemsIds = newItems.map((i) => i._id);
  const oldItemsPurged = oldItems.filter((i) => !newItemsIds.includes(i._id));
  return [...oldItemsPurged, ...newItems];
};

const Loader = () => {
  const API = useApi();
  const [picture, setPicture] = useState([picture1, picture3, picture2][randomIntFromInterval(0, 2)]);
  const [lastRefresh, setLastRefresh] = useRecoilState(lastRefreshState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const setCollectionsToLoad = useSetRecoilState(collectionsToLoadState);
  const [progress, setProgress] = useRecoilState(progressState);
  const [fullScreen, setFullScreen] = useRecoilState(loaderFullScreenState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const teams = useRecoilValue(teamsState);
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

  // to prevent auto-refresh to trigger on the first render
  const initialLoadDone = useRef(null);
  const autoRefreshInterval = useRef(null);

  const refresh = async () => {
    clearInterval(autoRefreshInterval.current);
    autoRefreshInterval.current = null;

    const { showFullScreen, initialLoad } = refreshTrigger.options;
    setFullScreen(showFullScreen);
    setLoading(initialLoad ? 'Chargement...' : 'Rafraichissement...');

    /*
    Play organisation internal migrations (things that requires the database to be fully loaded locally).
    */

    if (!organisation.migrations?.includes('passages-from-comments-to-table')) {
      await new Promise((res) => setTimeout(res, 500));
      setLoading('Mise à jour des données de votre organisation, veuillez patienter quelques instants...');
      const allReports = await getData({
        collectionName: 'report',
        data: reports,
        isInitialization: initialLoad,
        setBatchData: (newReports) => {
          newReports = newReports.filter((r) => !!r.team && !!r.date);
          setReports((oldReports) => (initialLoad ? [...oldReports, ...newReports] : mergeItems(oldReports, newReports)));
        },
        API,
      });
      const commentsToMigrate = await getData({
        collectionName: 'comment',
        data: comments,
        isInitialization: initialLoad,
        setBatchData: (newComments) =>
          setComments((oldComments) => (initialLoad ? [...oldComments, ...newComments] : mergeItems(oldComments, newComments))),
        API,
      });
      // Anonymous passages
      const reportsToMigrate = allReports.filter((r) => r.passages > 0);
      const newPassages = [];
      for (const report of reportsToMigrate) {
        for (let i = 1; i <= report.passages; i++) {
          newPassages.push({
            person: null,
            team: report.team,
            user: null,
            date: dayjs(report.date)
              .startOf('day')
              .add(teams.find((t) => t._id === report.team).nightSession ? 12 : 0, 'hour'),
          });
        }
      }
      const passagesComments = commentsToMigrate.filter((c) => c?.comment?.includes('Passage enregistré'));
      for (const passage of passagesComments) {
        newPassages.push({
          person: passage.person,
          team: passage.team,
          user: passage.user,
          date: dayjs(passage.createdAt),
        });
      }
      const commentIdsToDelete = passagesComments.map((p) => p._id);
      setComments((comments) => comments.filter((c) => !commentIdsToDelete.includes(c._id)));
      const encryptedPassages = await Promise.all(newPassages.map(preparePassageForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const encryptedReportsToMigrate = await Promise.all(reportsToMigrate.map(prepareReportForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
      const response = await API.put({
        path: `/migration/passages-from-comments-to-table`,
        body: {
          newPassages: encryptedPassages,
          commentIdsToDelete,
          reportsToMigrate: encryptedReportsToMigrate,
        },
      });
      if (!response.ok) {
        if (response.error) {
          setLoading(response.error);
          setProgress(1);
        }
        return;
      }
      setOrganisation(response.organisation);
    }

    /*
    Get number of data to download to show the appropriate loading progress bar
    */
    const response = await API.get({
      path: '/organisation/stats',
      query: { organisation: organisationId, lastRefresh },
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
      response.data.relsPersonPlace;

    if (lastRefresh > 0 && user.healthcareProfessional) {
      // medical data is never saved in cache
      // so we always have to download all at every page reload
      // therefore for the loader to be efficient, we need to
      const medicalDataResponse = await API.get({
        path: '/organisation/stats',
        query: { organisation: organisationId, lastRefresh: 0 },
      });
      if (!medicalDataResponse.ok) {
        setRefreshTrigger({
          status: false,
          options: { showFullScreen: false, initialLoad: false },
        });
        return;
      }
      total = total + medicalDataResponse.data.consultations + medicalDataResponse.data.treatments + medicalDataResponse.data.medicalFiles;
    }

    if (initialLoad) {
      total = total + collections.length; // for the progress bar to be beautiful
    }

    if (!total) {
      // if nothing to load, just show a beautiful progress bar
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPersons) => setPersons((oldPersons) => (initialLoad ? [...oldPersons, ...newPersons] : mergeItems(oldPersons, newPersons))),
        API,
      });
      if (refreshedPersons)
        setPersons(
          refreshedPersons.map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt })).sort((p1, p2) => p1.name.localeCompare(p2.name))
        );
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'person'));
    /*
    Get consultations
    */
    if (response.data.consultations || initialLoad) {
      setLoading('Chargement des consultations');
      const refreshedConsultations = await getData({
        collectionName: 'consultation',
        data: consultations,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh: initialLoad ? 0 : lastRefresh, // because we never save medical data in cache
        setBatchData: (newConsultations) =>
          setConsultations((oldConsultations) =>
            initialLoad
              ? [...oldConsultations, ...newConsultations.map((c) => whitelistAllowedData(c, user))]
              : mergeItems(
                  oldConsultations,
                  newConsultations.map((c) => whitelistAllowedData(c, user))
                )
          ),
        API,
      });
      if (refreshedConsultations) setConsultations(refreshedConsultations.map((c) => whitelistAllowedData(c, user)));
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'consultation'));
    /*
    Get treatments
    */
    if (user.healthcareProfessional && (response.data.treatments || initialLoad)) {
      setLoading('Chargement des traitements');
      const refreshedTreatments = await getData({
        collectionName: 'treatment',
        data: treatments,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh: initialLoad ? 0 : lastRefresh, // because we never save medical data in cache
        setBatchData: (newTreatments) =>
          setTreatments((oldTreatments) => (initialLoad ? [...oldTreatments, ...newTreatments] : mergeItems(oldTreatments, newTreatments))),
        API,
      });
      if (refreshedTreatments) setTreatments(refreshedTreatments);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'treatment'));
    /*
    Get medicalFiles
    */
    if (user.healthcareProfessional && (response.data.medicalFiles || initialLoad)) {
      setLoading('Chargement des informations médicales');
      const refreshedMedicalFiles = await getData({
        collectionName: 'medical-file',
        data: medicalFiles,
        isInitialization: initialLoad,
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh: initialLoad ? 0 : lastRefresh, // because we never save medical data in cache
        setBatchData: (newMedicalFiles) =>
          setMedicalFiles((oldMedicalFiles) =>
            initialLoad ? [...oldMedicalFiles, ...newMedicalFiles] : mergeItems(oldMedicalFiles, newMedicalFiles)
          ),
        API,
      });
      if (refreshedMedicalFiles) setMedicalFiles(refreshedMedicalFiles);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'medical-file'));
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newReports) => {
          newReports = newReports.filter((r) => !!r.team && !!r.date);
          setReports((oldReports) => (initialLoad ? [...oldReports, ...newReports] : mergeItems(oldReports, newReports)));
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPassages) =>
          setPassages((oldPassages) => (initialLoad ? [...oldPassages, ...newPassages] : mergeItems(oldPassages, newPassages))),
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newActions) => setActions((oldActions) => (initialLoad ? [...oldActions, ...newActions] : mergeItems(oldActions, newActions))),
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newTerritories) =>
          setTerritories((oldTerritories) => (initialLoad ? [...oldTerritories, ...newTerritories] : mergeItems(oldTerritories, newTerritories))),
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newPlaces) => setPlaces((oldPlaces) => (initialLoad ? [...oldPlaces, ...newPlaces] : mergeItems(oldPlaces, newPlaces))),
        API,
      });
      if (refreshedPlaces) setPlaces(refreshedPlaces.sort((p1, p2) => p1.name.localeCompare(p2.name)));
    }
    if (response.data.relsPersonPlace || initialLoad) {
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newObs) => setTerritoryObs((oldObs) => (initialLoad ? [...oldObs, ...newObs] : mergeItems(oldObs, newObs))),
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
        setProgress: (batch) => setProgress((p) => (p * total + batch) / total),
        lastRefresh,
        setBatchData: (newComments) =>
          setComments((oldComments) => (initialLoad ? [...oldComments, ...newComments] : mergeItems(oldComments, newComments))),
        API,
      });
      if (refreshedComments) setComments(refreshedComments);
    }
    setCollectionsToLoad((c) => c.filter((collectionName) => collectionName !== 'comment'));

    /*
    Reset refresh trigger
    */
    initialLoadDone.current = true;
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
    if (refreshTrigger.status === true) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger.status]);

  useEffect(() => {
    if (!autoRefreshInterval.current && initialLoadDone.current) {
      autoRefreshInterval.current = setInterval(async () => {
        const response = await API.get({
          path: '/organisation/stats',
          query: { organisation: organisationId, lastRefresh },
        });
        if (!response.ok) return;

        let total =
          response.data.actions +
          response.data.persons +
          response.data.territories +
          response.data.territoryObservations +
          response.data.places +
          response.data.comments +
          response.data.passages +
          response.data.reports +
          response.data.relsPersonPlace;

        if (total) {
          setRefreshTrigger({
            status: true,
            options: { showFullScreen: false, initialLoad: false },
          });
        }
      }, 2 * 60 * 1000);
    }
  }, [lastRefresh, organisationId, API, setRefreshTrigger]);

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
