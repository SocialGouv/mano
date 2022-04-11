import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { currentTeamState } from '../recoil/auth';
import { TODO } from '../recoil/actions';
import { useRecoilValue } from 'recoil';

const PaginationContext = React.createContext();

export const PaginationProvider = ({ children }) => {
  const currentTeam = useRecoilValue(currentTeamState);

  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [state, setState] = useState({
    page: searchParams.get('search') || 0,
    search: searchParams.get('search') || '',
    status: searchParams.get('status') === null ? TODO : searchParams.get('status'),
    filterTeams: [],
  });

  const setStatus = (status, changeParams = true) => {
    if (!!window && changeParams) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('status', status || '');
      history.replace({ pathname: location.pathname, search: searchParams.toString() });
      // returns the existing query string: '?type=fiction&author=fahid'
    }
    setState((oldState) => ({ ...oldState, status, page: 0 }));
  };
  const setPage = (page, changeParams = false) => {
    if (!!window && changeParams) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('page', page);
      history.replace({ pathname: location.pathname, search: searchParams.toString() });
      // returns the existing query string: '?type=fiction&author=fahid'
    }
    setState((oldState) => ({ ...oldState, page }));
  };
  const setSearch = (search) => {
    if (!!window) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('search', search);
      history.replace({ pathname: location.pathname, search: searchParams.toString() });
      // returns the existing query string: '?type=fiction&author=fahid'
    }
    setState((oldState) => ({ ...oldState, search, page: 0 }));
  };
  const setFilterTeams = (filterTeams) => setState((oldState) => ({ ...oldState, filterTeams, page: 0 }));
  const setFilterAlertness = (alertness) => setState((oldState) => ({ ...oldState, alertness, page: 0 }));
  const setFilterOutOfActiveList = (outOfActiveList) => setState((oldState) => ({ ...oldState, outOfActiveList, page: 0 }));
  useEffect(() => {
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam?._id]);

  return (
    <PaginationContext.Provider
      value={{
        ...state,
        setState,
        setStatus,
        setPage,
        setSearch,
        setFilterTeams,
        setFilterAlertness,
        setFilterOutOfActiveList,
      }}>
      {children}
    </PaginationContext.Provider>
  );
};
export default PaginationContext;
