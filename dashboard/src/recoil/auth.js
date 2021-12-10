/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';
import { MMKV, useStorage } from '../services/dataManagement';
import { AppSentry } from '../services/sentry';

export const userState = atom({
  key: 'userState',
  default: null,
});

export const organisationState = atom({
  key: 'organisationState',
  default: {},
});

export const teamsState = atom({
  key: 'teamsState',
  default: [],
});

export const usersState = atom({
  key: 'usersState',
  default: [],
});

export const currentTeamState = atom({
  key: 'currentTeamState',
  default: null,
});

export const useAuth = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [teams, setTeams] = useRecoilState(teamsState);
  const [users, setUsers] = useRecoilState(usersState);
  const [currentTeam, setCurrentTeam] = useRecoilState(currentTeamState);
  const [organisationId, setOrganisationId] = useStorage('orgnisation-id', null);

  useEffect(() => {
    AppSentry.setContext('currentTeam', currentTeam || {});
  }, [currentTeam]);

  useEffect(() => {
    if (!!organisation?._id && organisation._id !== organisationId) {
      MMKV?.clearStore();
      MMKV?.clearMemoryCache();
      setOrganisationId(organisation._id);
    }
  }, [organisation?._id]);

  return { organisation, currentTeam, teams, users, setUsers, setOrganisation, setTeams, setCurrentTeam, organisationId };
};
