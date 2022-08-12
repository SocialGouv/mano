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
  const [consultations, setConsultations] = useRecoilState(consultationsState);

  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [refreshTriggerDataLoader, setRefreshTriggerDataLoader] = useRecoilState(refreshTriggerDataLoaderState);
  const [lastRefresh, setLastRefresh] = useRecoilState(lastRefreshState);

  const [refreshList, setRefreshList] = useState({ list: [], offset: 0 });
  const [progressBuffer, setProgressBuffer] = useState(null);
  const [loadingText, setLoadingText] = useState('');
  const [fullScreen, setFullScreen] = useState(false);
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
          let total = 0 + stats.persons;
          if (stats.persons) newList.push('person');
          if (stats.consultations) newList.push('consultation');
          if (stats.treatments) newList.push('treatment');
          if (stats.medicalFiles) newList.push('medicalFile');

          Promise.resolve()
            .then(() => getCacheItemDefaultValue('person', []))
            .then((persons) => setPersons([...persons]))
            .then(() => {
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
      }
    })();
  }

  if (!refreshList.list?.length) return <RandomPicturePreloader />;

  if (fullScreen && refreshList.list?.length) {
    return (
      <FullScreenContainer>
        <InsideContainer>
          <RandomPicture />
          <ProgressBar progress={progress} loadingText={loadingText} />
        </InsideContainer>
      </FullScreenContainer>
    );
  }

  return (
    <Container>
      <ProgressBar progress={progress} loadingText={loadingText} />
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
