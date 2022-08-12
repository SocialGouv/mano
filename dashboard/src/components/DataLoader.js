import { RandomPicture, RandomPicturePreloader } from './LoaderRandomPicture';
import ProgressBar from './LoaderProgressBar';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { useEffect, useState } from 'react';
import { personsState } from '../recoil/persons';
import styled from 'styled-components';
import { organisationState, userState } from '../recoil/auth';
import { getCacheItem, getCacheItemDefaultValue, setCacheItem } from '../services/dataManagement';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../services/api';
import { lastRefreshState } from './Loader';
import { consultationsState, whitelistAllowedData } from '../recoil/consultations';
import { treatmentsState } from '../recoil/treatments';
import { actionsState } from '../recoil/actions';
import { medicalFileState } from '../recoil/medicalFiles';
import { passagesState } from '../recoil/passages';
import { reportsState } from '../recoil/reports';
import { territoriesState } from '../recoil/territory';
import { placesState } from '../recoil/places';
import { relsPersonPlaceState } from '../recoil/relPersonPlace';
import { territoryObservationsState } from '../recoil/territoryObservations';
import { commentsState } from '../recoil/comments';
import { dayjsInstance } from '../services/date';

// Update to flush cache.
const currentCacheKey = 'mano-last-refresh-2022-05-30';

export const refreshTriggerDataLoaderState = atom({
  key: 'refreshTriggerDataLoaderState',
  default: false,
});

function mergeItems(oldItems, newItems) {
  const newItemsIds = newItems.map((i) => i._id);
  const oldItemsPurged = oldItems.filter((i) => !newItemsIds.includes(i._id));
  return [...oldItemsPurged, ...newItems];
}

export default function DataLoader() {
  const API = useApi();
  const user = useRecoilValue(userState);

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

  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [refreshTriggerDataLoader, setRefreshTriggerDataLoader] = useRecoilState(refreshTriggerDataLoaderState);
  const [lastRefresh, setLastRefresh] = useRecoilState(lastRefreshState);

  const [refreshList, setRefreshList] = useState({ list: [], offset: 0 });
  const [progressBuffer, setProgressBuffer] = useState(null);
  const [loadingText, setLoadingText] = useState('Chargement des données...');
  const [fullScreen, setFullScreen] = useState(true);
  const [progress, setProgress] = useState(null);
  const [total, setTotal] = useState(null);

  useEffect(initLoader, [progress, total, refreshTriggerDataLoader, refreshList.list.length]);
  useEffect(updateProgress, [progress, progressBuffer]);
  useEffect(refresh, [refreshList]);

  const organisationId = organisation?._id;
  const initialLoad = true; // TODO: fix

  function initLoader() {
    console.log(progress, total, refreshList.list.length);
    if (refreshList.list.length > 0) return;

    if (progress === null && total === null && refreshTriggerDataLoader) {
      console.log('Initialisation');
      getCacheItem(currentCacheKey).then((lastRefreshValue) => {
        setLastRefresh(lastRefreshValue || 0);
        API.get({
          path: '/organisation/stats',
          query: {
            organisation: organisationId,
            after: lastRefreshValue || 0,
            withDeleted: true,
            // Medical data is never saved in cache so we always have to download all at every page reload.
            withAllMedicalData: initialLoad,
          },
        }).then(({ data: stats }) => {
          const newList = [];
          let total =
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
            .then(() => {
              setFullScreen(true);
              setRefreshList({ list: newList, offset: 0 });
              setRefreshTriggerDataLoader(false);
              setProgress(0);
              setTotal(total);
            });
        });
      });
    }
    if (progress !== null && total !== null) {
      console.log('Finalisation');
      setLastRefresh(Date.now());
      setProgress(null);
      setTotal(null);
      return;
    }
  }

  function updateProgress() {
    if (progressBuffer !== null) {
      setProgressBuffer(null);
      setProgress((progress || 0) + progressBuffer);
    }
  }

  function refresh() {
    (async () => {
      if (refreshList.list.length === 0) return;

      const [current] = refreshList.list;
      const query = { organisation: organisationId, limit: String(500), page: String(refreshList.offset), after: lastRefresh };

      function handleMore(hasMore) {
        if (hasMore) setRefreshList({ list: refreshList.list, offset: refreshList.offset + 1 });
        else setRefreshList({ list: refreshList.list.slice(1), offset: 0 });
      }

      if (current === 'person') {
        setLoadingText('Chargement des personnes');
        const res = await API.get({ path: '/person', query });
        setPersons(
          mergeItems(persons, res.decryptedData)
            .map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt }))
            .sort((p1, p2) => (p1.name || '').localeCompare(p2.name || ''))
        );
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'consultation') {
        setLoadingText('Chargement des consultations');
        const res = await API.get({ path: '/consultation', query: { ...query, after: initialLoad ? 0 : lastRefresh } });
        setConsultations(mergeItems(consultations, res.decryptedData).map((c) => whitelistAllowedData(c, user)));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'treatment') {
        setLoadingText('Chargement des traitements');
        const res = await API.get({ path: '/treatment', query });
        setTreatments(mergeItems(treatments, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'medicalFile') {
        setLoadingText('Chargement des fichiers médicaux');
        const res = await API.get({ path: '/medical-file', query });
        setMedicalFiles(mergeItems(medicalFiles, res.decryptedData));
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'report') {
        setLoadingText('Chargement des rapports');
        const res = await API.get({ path: '/report', query });
        setReports(
          mergeItems(reports, res.decryptedData)
            .map((r) => !!r.team && !!r.date)
            .sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1))
        );
        handleMore(res.hasMore);
        setProgressBuffer(res.data.length);
      } else if (current === 'passage') {
        setLoadingText('Chargement des passages');
        const res = await API.get({ path: '/passage', query });
        setPassages(
          mergeItems(passages, res.decryptedData).sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1))
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

  if (!refreshList.list?.length && !refreshTriggerDataLoader) return <RandomPicturePreloader />;

  if (refreshTriggerDataLoader && fullScreen) {
    return (
      <FullScreenContainer>
        <InsideContainer>
          <ProgressBar progress={0} loadingText={loadingText} />
        </InsideContainer>
      </FullScreenContainer>
    );
  }

  if (fullScreen && refreshList.list?.length) {
    return (
      <FullScreenContainer>
        <InsideContainer>
          <RandomPicture />
          <ProgressBar progress={progress / total} loadingText={loadingText} />
        </InsideContainer>
      </FullScreenContainer>
    );
  }

  return (
    <Container>
      <ProgressBar progress={progress / total} loadingText={loadingText} />
    </Container>
  );
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
