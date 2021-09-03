/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { fr } from 'date-fns/esm/locale';
import { registerLocale } from 'react-datepicker';
import lifecycle from 'page-lifecycle';

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

import 'react-datepicker/dist/react-datepicker.css';
import AuthContext from './contexts/auth';
import API from './services/api';
import Reception from './scenes/reception';

registerLocale('fr', fr);

const App = () => {
  const onWindowFocus = () => {
    if (API.token) API.get({ path: '/check-auth' }); // will force logout if session is expired
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
  const { user } = useContext(AuthContext);
  return (
    <>
      {user && <Drawer />}
      <div className="main-content" style={{ marginLeft: user ? 230 : 0, marginTop: user ? 35 : 0 }}>
        <Route {...rest} render={(props) => (user ? <Component {...props} /> : <Redirect to={{ pathname: '/auth' }} />)} />
      </div>
    </>
  );
};

export default App;
