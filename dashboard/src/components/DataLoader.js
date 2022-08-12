import { RandomPicture, RandomPicturePreloader } from './LoaderRandomPicture';
import ProgressBar from './LoaderProgressBar';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { useEffect, useState } from 'react';
import { personsState } from '../recoil/persons';
import styled from 'styled-components';
import { organisationState, userState } from '../recoil/auth';
import { setCacheItem } from '../services/dataManagement';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../services/api';

// Update to flush cache.
const currentCacheKey = 'mano-last-refresh-2022-05-30';
const fullRefreshList = ['person'];

export const refreshTriggerDataLoaderState = atom({
  key: 'refreshTriggerDataLoaderState',
  default: false,
});

export default function DataLoader() {
  const API = useApi();
  const [persons, setPersons] = useRecoilState(personsState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [refreshTriggerDataLoader, setRefreshTriggerDataLoader] = useRecoilState(refreshTriggerDataLoaderState);
  const user = useRecoilValue(userState);

  const [refreshList, setRefreshList] = useState({ list: [], offset: 0 });
  const [progressBuffer, setProgressBuffer] = useState(null);
  const [loadingText, setLoadingText] = useState('');
  const [fullScreen, setFullScreen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [total, setTotal] = useState(null);

  const organisationId = organisation?._id;
  const initialLoad = true; // TODO: fix

  /*
  useEffect(
    function initRefreshList() {
      if (refreshTriggerDataLoader) {
        console.log(1);
        setRefreshTriggerDataLoader(false);
        setRefreshList({ list: fullRefreshList, offset: 0 });
      }
    },
    [refreshTriggerDataLoader]
  );
  */

  useEffect(
    function initLoader() {
      console.log(progress, total, refreshList.list.length);
      if (refreshList.list.length > 0) return;

      if (progress !== null && total !== null) {
        console.log('oups');
        setProgress(null);
        setTotal(null);
        return;
      }
      if (progress === null && refreshTriggerDataLoader) {
        console.log('BIM');
        API.get({
          path: '/organisation/stats',
          query: {
            organisation: organisationId,
            after: 0, // TODO: lastRefresh fix
            withDeleted: true,
            // Medical data is never saved in cache so we always have to download all at every page reload.
            withAllMedicalData: initialLoad,
          },
        }).then(({ data: stats }) => {
          const newList = [];
          let total = 0 + stats.persons;
          if (stats.persons) newList.push('person');
          setRefreshList({ list: newList, offset: 0 });
          setRefreshTriggerDataLoader(false);
          setProgress(0);
          setTotal(total);
        });
      }
    },
    [progress, total, refreshTriggerDataLoader, refreshList.list.length]
  );

  useEffect(
    function updateProgress() {
      if (progressBuffer !== null) {
        setProgressBuffer(null);
        setProgress((progress || 0) + progressBuffer);
      }
    },
    [progress, progressBuffer]
  );

  useEffect(
    function refresh() {
      (async () => {
        if (refreshList.list.length === 0) return;

        const [current] = refreshList.list;
        const options = { query: { organisation: organisationId, limit: String(500), page: String(refreshList.offset) } };

        function handleMore(hasMore) {
          if (hasMore) setRefreshList({ list: refreshList.list, offset: refreshList.offset + 1 });
          else setRefreshList({ list: refreshList.list.slice(1), offset: 0 });
        }

        if (current === 'person') {
          setLoadingText('Chargement des personnes');
          const res = await API.get({ path: '/person', ...options });
          setPersons([
            ...persons,
            ...res.decryptedData
              .map((p) => ({ ...p, followedSince: p.followedSince || p.createdAt }))
              .sort((p1, p2) => (p1.name || '').localeCompare(p2.name || '')),
          ]);
          handleMore(res.hasMore);
          setProgressBuffer(res.data.length);
        }

        /*
setLastRefresh(Date.now());
    setLoading('');
    setProgress(0);
    setFullScreen(false);
        */
      })();
    },
    [refreshList]
  );

  console.log(progress);

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
