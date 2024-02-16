import React, { useEffect, useState } from 'react';
import { RecoilEnv, RecoilRoot, useRecoilValue } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import { Router, Switch, Redirect } from 'react-router-dom';
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
import ActionModal from './components/ActionModal';
import Charte from './scenes/auth/charte';
import { userState } from './recoil/auth';
import API, { recoilResetKeyState, authTokenState } from './services/api';
import ScrollToTop from './components/ScrollToTop';
import TopBar from './components/TopBar';
import VersionOutdatedAlert from './components/VersionOutdatedAlert';
import ModalConfirm from './components/ModalConfirm';
import DataLoader, { initialLoadIsDoneState, useDataLoader } from './components/DataLoader';
import { Bounce, cssTransition, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SentryRoute from './components/Sentryroute';
import { ENV, VERSION } from './config';
import DuplicatedReportsTestChecker from './components/DuplicatedReportsTestChecker';
import ConsultationModal from './components/ConsultationModal';
import TreatmentModal from './scenes/person/components/TreatmentModal';
import BottomBar from './components/BottomBar';

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = process.env.REACT_APP_DISABLE_RECOIL_DUPLICATE_ATOM_KEY_CHECKING ? false : true;

const ToastifyFastTransition = cssTransition({
  enter: 'Toastify--animate Toastify__hack-force-fast Toastify__bounce-enter',
  exit: 'Toastify--animate Toastify__hack-force-fast Toastify__bounce-exit',
  appendPosition: true,
  collapseDuration: 0,
  collapse: true,
});

registerLocale('fr', fr);

const history = createBrowserHistory();

if (ENV === 'production') {
  Sentry.init({
    dsn: 'https://2e784fe581bff74181600b4460c01955@o4506615228596224.ingest.sentry.io/4506672157229056',
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
    tracesSampleRate: 0.05,
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
  const authToken = useRecoilValue(authTokenState);
  const user = useRecoilValue(userState);
  const initialLoadIsDone = useRecoilValue(initialLoadIsDoneState);

  const recoilResetKey = useRecoilValue(recoilResetKeyState);
  useEffect(() => {
    if (!!recoilResetKey) {
      resetRecoil();
    }
  }, [recoilResetKey, resetRecoil]);

  const { refresh } = useDataLoader();

  useEffect(() => {
    const onWindowFocus = (e) => {
      if (authToken && e.newState === 'active') {
        API.get({ path: '/check-auth' }) // will force logout if session is expired
          .then(() => {
            if (initialLoadIsDone) {
              // if the app is already loaded
              // will refresh data if session is still valid
              refresh();
            } else {
              console.log('initial load not done');
            }
          });
      }
    };
    lifecycle.addEventListener('statechange', onWindowFocus);
    return () => {
      lifecycle.removeEventListener('statechange', onWindowFocus);
    };
  }, [authToken, refresh, initialLoadIsDone]);

  if (process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' && window && !window.localStorage.getItem('by-pass-redirect')) {
    return (
      <div className="main-container">
        <div className="tw-mb-8 tw-border-l-4 tw-border-orange-500 tw-bg-orange-100 tw-p-4 tw-text-orange-700" role="alert">
          🚧 Mano n’est pas encore disponible sur ce site, vous devez patienter jusqu’au 5 mars en fin de journée.
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <ToastContainer transition={process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' ? Bounce : ToastifyFastTransition} />
      <VersionOutdatedAlert />
      {process.env.REACT_APP_TEST_PLAYWRIGHT === 'true' && <DuplicatedReportsTestChecker />}
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
          <RestrictedRoute path="/report-new" component={Report} />
          <RestrictedRoute path="*" component={() => <Redirect to={'stats'} />} />
        </Switch>
        <ActionModal />
        <ConsultationModal />
        <TreatmentModal />
        <ModalConfirm />
        {!!user && <DataLoader />}
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
        {/*
         height: auto;
    margin-left: 0 !important;
    max-width: 100%;
    padding: 0 !important;
    overflow: initial;
        */}
        <main className="tw-relative tw-flex tw-grow tw-basis-full tw-flex-col tw-overflow-auto tw-overflow-x-hidden tw-overflow-y-scroll tw-px-2 print:!tw-ml-0 print:tw-h-auto print:tw-max-w-full print:tw-overflow-visible print:tw-p-0 sm:tw-px-12 sm:tw-pt-4 sm:tw-pb-12">
          <SentryRoute {...rest} render={(props) => (user ? <Component {...props} /> : <Redirect to={{ pathname: '/auth' }} />)} />
        </main>
      </div>
      <BottomBar />
    </>
  );
};

export default function ContextedApp() {
  // https://github.com/facebookexperimental/Recoil/issues/758#issuecomment-737471220
  const [recoilKey, setRecoilKey] = useState(0);
  return (
    <RecoilRoot key={recoilKey}>
      {/* We need React.Suspense here because default values for `person`, `action` etc. tables is an async cache request */}
      {/* https://recoiljs.org/docs/guides/asynchronous-data-queries#query-default-atom-values */}
      <React.Suspense fallback={<div></div>}>
        {/* Recoil Nexus allows to use Recoil state outside React tree */}
        <RecoilNexus />
        <App resetRecoil={() => setRecoilKey((k) => k + 1)} />
      </React.Suspense>
    </RecoilRoot>
  );
}
