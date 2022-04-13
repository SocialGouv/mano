import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const setDataAsSearchParam = (data) => {
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
};

const getDataAsSearchParam = (data, defaultValue) => {
  if (!data) return null;
  // handle objects
  if (typeof defaultValue === 'string') return data;
  if (typeof defaultValue === 'number') return Number(data);
  try {
    return JSON.parse(data);
  } catch (e) {
    // should be string
    return data;
  }
};

const useSearchParamState = (param, defaultValue) => {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [state, setState] = useState(() => getDataAsSearchParam(searchParams.get(param), defaultValue) || defaultValue);

  const setStateRequest = (newState) => {
    if (!!window) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set(param, setDataAsSearchParam(newState));
      history.replace({ pathname: location.pathname, search: searchParams.toString() });
      // returns the existing query string: '?type=fiction&author=fahid'
    }
    setState(newState);
  };

  return [state, setStateRequest];
};

export default useSearchParamState;
