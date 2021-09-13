import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { AppSentry } from '../services/sentry';

const AuthContext = React.createContext({});

export const AuthProvider = ({ children }) => {
  const initAuth = { user: null, organisation: {}, teams: [], users: [] };
  const initCurrentTeam = null;

  const [auth, setAuthState] = useState(initAuth);
  const [currentTeam, setCurrentTeam] = useState(initCurrentTeam);

  useEffect(() => {
    AppSentry.setUser(auth?.user || {});
  }, [auth?.user]);

  useEffect(() => {
    if (auth?.organisation?._id) {
      API.organisation = auth?.organisation;
    }
  }, [auth?.organisation]);

  useEffect(() => {
    AppSentry.setContext('currentTeam', currentTeam || {});
  }, [currentTeam]);

  const setAuth = (newAuth) => setAuthState((prevAuth) => ({ ...prevAuth, ...newAuth }));
  const resetAuth = () => {
    setAuthState(initAuth);
    setCurrentTeam(initCurrentTeam);
  };

  return <AuthContext.Provider value={{ ...auth, currentTeam, setAuth, resetAuth, setCurrentTeam }}>{children}</AuthContext.Provider>;
};

export default AuthContext;
