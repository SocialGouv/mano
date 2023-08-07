import { useEffect, useState } from 'react';
import { RecoilEnv, RecoilRoot, useRecoilValue } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import { BrowserRouter as Router, Switch, Redirect } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { fr } from 'date-fns/esm/locale';
import { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-spring-bottom-sheet/dist/style.css';
import lifecycle from 'page-lifecycle';
import Account from './scenes/account';
import Auth from './scenes/auth';
import Organisation from './scenes/organisation';
import Action from './scenes/action';
import Structure from './scenes/structure';
import Place from './scenes/place';
import Team from './scenes/team';
import User from './scenes/user';
import Person from './scenes/person';
import Drawer from './components/drawer';
import Charte from './scenes/auth/charte';
import { userState } from './recoil/auth';
import API, { recoilResetKeyState, authTokenState } from './services/api';
import DataLoader, { useDataLoader } from './components/DataLoader';
import 'react-toastify/dist/ReactToastify.css';
import SentryRoute from './components/Sentryroute';
import { ENV, VERSION } from './config';
import Home from './scenes/home';

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = process.env.REACT_APP_DISABLE_RECOIL_DUPLICATE_ATOM_KEY_CHECKING ? false : true;

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
  const user = useRecoilValue(userState);
  const authToken = useRecoilValue(authTokenState);
  const recoilResetKey = useRecoilValue(recoilResetKeyState);
  useEffect(() => {
    if (!!recoilResetKey) {
      resetRecoil();
    }
  }, [recoilResetKey, resetRecoil]);

  useEffect(() => {
    const onWindowFocus = (e) => {
      if (authToken && e.newState === 'active') {
        API.get({ path: '/check-auth' }); // will force logout if session is expired
      }
    };
    lifecycle.addEventListener('statechange', onWindowFocus);
    return () => {
      lifecycle.removeEventListener('statechange', onWindowFocus);
    };
  }, [authToken]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Router>
        <div className="main">
          {user && <Drawer />}
          <div style={{ height: '100%', marginLeft: user ? 260 : 0, padding: '0 68px' }}>
            <Switch>
              <SentryRoute path="/auth" component={Auth} />
              <RestrictedRoute path="/account" component={Account} />
              <RestrictedRoute path="/user" component={User} />
              <RestrictedRoute path="/person" component={Person} />
              <RestrictedRoute path="/place" component={Place} />
              <RestrictedRoute path="/action" component={Action} />
              <RestrictedRoute path="/structure" component={Structure} />
              <RestrictedRoute path="/team" component={Team} />
              <RestrictedRoute path="/organisation" component={Organisation} />
              <RestrictedRoute path="/home" component={Home} />
              <RestrictedRoute path="*" component={() => <Redirect to={'home'} />} />
            </Switch>
          </div>
        </div>
      </Router>
      <DataLoader />
    </div>
  );
};

const RestrictedRoute = ({ component: Component, _isLoggedIn, ...rest }) => {
  const { fullScreen } = useDataLoader();
  const user = useRecoilValue(userState);
  if (!!user && !user?.termsAccepted) return <SentryRoute {...rest} path="/auth" component={Charte} />;

  // Do not show content if loading state is fullscreen and user is logged in.
  if (user && fullScreen) return <div></div>;
  return <SentryRoute {...rest} render={(props) => (user ? <Component {...props} /> : <Redirect to={{ pathname: '/auth' }} />)} />;
};

export default function ContextedApp() {
  // https://github.com/facebookexperimental/Recoil/issues/758#issuecomment-737471220
  const [recoilKey, setRecoilKey] = useState(0);
  return (
    <RecoilRoot key={recoilKey}>
      <RecoilNexus />
      <App resetRecoil={() => setRecoilKey((k) => k + 1)} />
    </RecoilRoot>
  );
}
