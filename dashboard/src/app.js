import React, { useCallback, useEffect, useState } from 'react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { fr } from 'date-fns/esm/locale';
import { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
import Loader, { loaderFullScreenState } from './components/Loader';
import Reception from './scenes/reception';
import Charte from './scenes/auth/charte';
import { userState } from './recoil/auth';
import useApi, { recoilResetKeyState, tokenCached } from './services/api';
import ScrollToTop from './components/ScrollToTop';
import TopBar from './components/TopBar';
import VersionOutdatedAlert from './components/VersionOutdatedAlert';
import ModalConfirm from './components/ModalConfirm';

const store = createStore(combineReducers({ toastr }));

registerLocale('fr', fr);

const App = ({ resetRecoil }) => {
  const API = useApi();

  const recoilResetKey = useRecoilValue(recoilResetKeyState);
  useEffect(() => {
    if (!!recoilResetKey) resetRecoil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoilResetKey]);

  const onWindowFocus = useCallback((e) => {
    if (tokenCached && e.newState === 'active') API.get({ path: '/check-auth' }); // will force logout if session is expired
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    lifecycle.addEventListener('statechange', onWindowFocus);
    return () => {
      lifecycle.removeEventListener('statechange', onWindowFocus);
    };
  }, [onWindowFocus]);

  return (
    <div className="main-container">
      <VersionOutdatedAlert />
      <Router>
        <ScrollToTop />
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
  );
};

const RestrictedRoute = ({ component: Component, _isLoggedIn, ...rest }) => {
  const fullScreen = useRecoilValue(loaderFullScreenState);
  const user = useRecoilValue(userState);
  if (!!user && !user?.termsAccepted)
    return (
      <main className="main">
        <Route {...rest} path="/auth" component={Charte} />
      </main>
    );

  // Do not show content if loading state is fullscreen and user is logged in.
  if (user && fullScreen) return <div></div>;
  return (
    <>
      {!!user && <TopBar />}
      <div className="main">
        {!!user && !['superadmin'].includes(user.role) && <Drawer />}
        <main className="main-content">
          <Route {...rest} render={(props) => (user ? <Component {...props} /> : <Redirect to={{ pathname: '/auth' }} />)} />
        </main>
      </div>
    </>
  );
};

export default function ContextedApp() {
  // https://github.com/facebookexperimental/Recoil/issues/758#issuecomment-737471220
  const [recoilKey, setRecoilKey] = useState(0);
  return (
    <RecoilRoot key={recoilKey}>
      <Provider store={store}>
        <App resetRecoil={() => setRecoilKey((k) => k + 1)} />
        <ReduxToastr transitionIn="fadeIn" transitionOut="fadeOut" />
        <Loader />
        <ModalConfirm />
      </Provider>
    </RecoilRoot>
  );
}
