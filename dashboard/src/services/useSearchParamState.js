import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

const setDataAsSearchParam = (data) => {
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return data;
  if (typeof data === 'boolean') return data;
  return JSON.stringify(data);
};

const getDataAsSearchParam = (data, defaultValue) => {
  if (!data) return null;
  // handle objects
  if (typeof defaultValue === 'string') return data;
  if (typeof defaultValue === 'number') return Number(data);
  if (typeof defaultValue === 'boolean') return Boolean(data);
  try {
    return JSON.parse(data);
  } catch (e) {
    // should be string
    return data;
  }
};

// NOTE: its not possible to update two different URLSearchParams very quickly, the second one cancels the first one

const useSearchParamState = (param, defaultAndInitialValue, { resetToDefaultIfTheFollowingValueChange = null } = {}) => {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [state, setState] = useState(() => getDataAsSearchParam(searchParams.get(param), defaultAndInitialValue) || defaultAndInitialValue);

  const setStateRequest = (newState, { sideEffect = null } = {}) => {
    if (!!window) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set(param, setDataAsSearchParam(newState));
      if (Array.isArray(sideEffect) && sideEffect?.length === 2) {
        const [sideEffectParam, sideEffectValue] = sideEffect;
        searchParams.set(sideEffectParam, setDataAsSearchParam(sideEffectValue));
      }
      history.replace({ pathname: location.pathname, search: searchParams.toString() });
      // returns the existing query string: '?type=fiction&author=fahid'
    }
    setState(newState);
  };

  const resetKey = resetToDefaultIfTheFollowingValueChange;
  const resetKeyRef = useRef(resetToDefaultIfTheFollowingValueChange);
  useEffect(() => {
    // effect not triggered on mount
    if (resetKey !== resetKeyRef.current) {
      setStateRequest(defaultAndInitialValue);
      resetKeyRef.current = resetKey;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return [state, setStateRequest];
};

export default useSearchParamState;
