import React, { useCallback, useEffect, useState } from 'react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { Router, Switch, Redirect } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { fr } from 'date-fns/esm/locale';
import { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
import Reception from './scenes/reception';
import Charte from './scenes/auth/charte';
import { userState } from './recoil/auth';
import useApi, { recoilResetKeyState, tokenCached } from './services/api';
import ScrollToTop from './components/ScrollToTop';
import TopBar from './components/TopBar';
import VersionOutdatedAlert from './components/VersionOutdatedAlert';
import ModalConfirm from './components/ModalConfirm';
import DataLoader, { useDataLoader } from './components/DataLoader';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SentryRoute from './components/Sentryroute';
import { ENV, VERSION } from './config';

registerLocale('fr', fr);

const history = createBrowserHistory();

if (ENV === 'production') {
  Sentry.init({
    dsn: 'https://e3eb487403dd4789b47cf6da857bb4bf@sentry.fabrique.social.gouv.fr/52',
    environment: 'dashboard',
    release: VERSION,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV5Instrumentation(history),
      }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      // ???
      'withrealtime/messaging',
      // This error seems to happen only in firefox and to be ignorable.
      // The "fetch" failed because user has navigated.
      // Since other browsers don't have this problem, we don't care about it,
      // it may be a false positive.
      'AbortError: The operation was aborted',
    ],
  });
}

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
      {process.env.REACT_APP_TEST !== 'true' && <ToastContainer limit={process.env.REACT_APP_TEST === 'true' ? 1 : 10} />}
      <VersionOutdatedAlert />
      <Router history={history}>
        <ScrollToTop />
        <Switch>
          <SentryRoute path="/auth" component={Auth} />
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
  const { fullScreen } = useDataLoader();
  const user = useRecoilValue(userState);
  if (!!user && !user?.termsAccepted)
    return (
      <main className="main">
        <SentryRoute {...rest} path="/auth" component={Charte} />
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
          <SentryRoute {...rest} render={(props) => (user ? <Component {...props} /> : <Redirect to={{ pathname: '/auth' }} />)} />
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
      <App resetRecoil={() => setRecoilKey((k) => k + 1)} />
      <DataLoader />
      <ModalConfirm />
    </RecoilRoot>
  );
}
