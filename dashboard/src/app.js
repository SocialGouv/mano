/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { RecoilRoot, useRecoilState } from 'recoil';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { fr } from 'date-fns/esm/locale';
import { registerLocale } from 'react-datepicker';
import lifecycle from 'page-lifecycle';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import ReduxToastr, { reducer as toastr } from 'react-redux-toastr';

import Account from './scenes/account';
import Auth from './scenes/auth';
import Organisation from './scenes/organisation';
import Action from './scenes/action';
import Territory from './scenes/territory';
import Structure from './scenes/structure';
import Place from './scenes/place';
import Team from './scenes/team';
import Stats from './scenes/stats';
import SearchView from './scenes/search';
import User from './scenes/user';
import Report from './scenes/report';

import Person from './scenes/person';

import Drawer from './components/drawer';
import Loader from './components/Loader';

import 'react-datepicker/dist/react-datepicker.css';
import Reception from './scenes/reception';
import Charte from './scenes/auth/charte';
import { useAuth } from './recoil/auth';
import useApi from './services/api-interface-with-dashboard';
import { tokenState } from './services/api';

const store = createStore(combineReducers({ toastr }));

registerLocale('fr', fr);

const App = () => {
  const API = useApi();
  const token = useRecoilState(tokenState);

  const onWindowFocus = (e) => {
    if (token && e.newState === 'active') API.get({ path: '/check-auth' }); // will force logout if session is expired
  };

  useEffect(() => {
    lifecycle.addEventListener('statechange', onWindowFocus);
    return () => {
      lifecycle.removeEventListener('statechange', onWindowFocus);
    };
  }, []);

  return (
    <div className="main-container">
      <div className="main">
        <Router>
          <Switch>
            <Route path="/auth" component={Auth} />
            <RestrictedRoute path="/charte" component={Charte} />
            <RestrictedRoute path="/account" component={Account} />
            <RestrictedRoute path="/user" component={User} />
            <RestrictedRoute path="/person" component={Person} />
            <RestrictedRoute path="/place" component={Place} />
            <RestrictedRoute path="/action" component={Action} />
            <RestrictedRoute path="/territory" component={Territory} />
            <RestrictedRoute path="/structure" component={Structure} />
            <RestrictedRoute path="/team" component={Team} />
            <RestrictedRoute path="/organisation" component={Organisation} />
            <RestrictedRoute path="/stats" component={Stats} />
            <RestrictedRoute path="/reception" component={Reception} />
            <RestrictedRoute path="/search" component={SearchView} />
            <RestrictedRoute path="/report" component={Report} />
            <RestrictedRoute path="*" component={() => <Redirect to={'stats'} />} />
          </Switch>
        </Router>
      </div>
    </div>
  );
};

const RestrictedRoute = ({ component: Component, isLoggedIn, ...rest }) => {
  const { user } = useAuth();
  if (!!user && !user?.termsAccepted) return <Route {...rest} path="/auth" component={Charte} />;
  return (
    <>
      {user && <Drawer />}
      <div className="main-content" style={{ marginLeft: user ? 230 : 0, marginTop: user ? 35 : 0 }}>
        <Route {...rest} render={(props) => (user ? <Component {...props} /> : <Redirect to={{ pathname: '/auth' }} />)} />
      </div>
    </>
  );
};

export default function ContextedApp() {
  return (
    <RecoilRoot>
      <Provider store={store}>
        <App />
        <ReduxToastr transitionIn="fadeIn" transitionOut="fadeOut" />
        <Loader />
      </Provider>
    </RecoilRoot>
  );
}
