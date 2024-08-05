import { Suspense, useEffect } from "react";
import { RecoilEnv, RecoilRoot, useRecoilValue } from "recoil";
import RecoilNexus from "recoil-nexus";
import { Router, Switch, Redirect } from "react-router-dom";
import { createBrowserHistory } from "history";
import * as Sentry from "@sentry/react";
import { fr } from "date-fns/esm/locale";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addToDebugMixedOrgsBug } from "./utils/debug-mixed-orgs-bug";
import Account from "./scenes/account";
import Auth from "./scenes/auth";
import Organisation from "./scenes/organisation";
import Action from "./scenes/action";
import Territory from "./scenes/territory";
import Structure from "./scenes/structure";
import Team from "./scenes/team";
import Stats from "./scenes/stats";
import SearchView from "./scenes/search";
import User from "./scenes/user";
import Report from "./scenes/report";
import Person from "./scenes/person";
import Drawer from "./components/drawer";
import Reception from "./scenes/reception";
import ActionModal from "./components/ActionModal";
import Charte from "./scenes/auth/charte";
import { userState } from "./recoil/auth";
import API, { tryFetch } from "./services/api";
import ScrollToTop from "./components/ScrollToTop";
import TopBar from "./components/TopBar";
import VersionOutdatedAlert from "./components/VersionOutdatedAlert";
import ModalConfirm from "./components/ModalConfirm";
import DataLoader, { initialLoadIsDoneState, useDataLoader } from "./components/DataLoader";
import { Bounce, cssTransition, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SentryRoute from "./components/Sentryroute";
import { ENV, VERSION } from "./config";
import DuplicatedReportsTestChecker from "./components/DuplicatedReportsTestChecker";
import ConsultationModal from "./components/ConsultationModal";
import TreatmentModal from "./scenes/person/components/TreatmentModal";
import BottomBar from "./components/BottomBar";
import CGUs from "./scenes/auth/cgus";
import { getHashedOrgEncryptionKey } from "./services/encryption";
import { deploymentCommitState, deploymentDateState, showOutdateAlertBannerState } from "./recoil/version";

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = import.meta.env.VITE_DISABLE_RECOIL_DUPLICATE_ATOM_KEY_CHECKING ? false : true;

const ToastifyFastTransition = cssTransition({
  enter: "Toastify--animate Toastify__hack-force-fast Toastify__bounce-enter",
  exit: "Toastify--animate Toastify__hack-force-fast Toastify__bounce-exit",
  appendPosition: true,
  collapseDuration: 0,
  collapse: true,
});

registerLocale("fr", fr);

const history = createBrowserHistory();

if (ENV === "production") {
  Sentry.init({
    dsn: "https://2e784fe581bff74181600b4460c01955@o4506615228596224.ingest.sentry.io/4506672157229056",
    environment: "dashboard",
    release: VERSION,
    integrations: [Sentry.reactRouterV5BrowserTracingIntegration({ history })],
    maxValueLength: 10000,
    normalizeDepth: 10,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.05,
    ignoreErrors: [
      "Network request failed",
      // "Failed to fetch",
      "NetworkError",
      // ???
      "withrealtime/messaging",
      // This error seems to happen only in firefox and to be ignorable.
      // The "fetch" failed because user has navigated.
      // Since other browsers don't have this problem, we don't care about it,
      // it may be a false positive.
      "AbortError: The operation was aborted",
      // Sur safari, on a des erreur de type "TypeError: cancelled" qui seraient liées
      // au bouton "X" (ou refresh) pressé pendant un fetch. Il semblerait que la meilleure
      // approche soit de les ignorer.
      // Cf: https://stackoverflow.com/a/60860369/978690
      "TypeError: cancelled",
      "TypeError: annulé",
    ],
  });
}

function abortRequests() {
  // On souhaite rester silencieux sur ces erreurs, parce qu'on se contente de les annuler exprès
  // Source: https://stackoverflow.com/a/73783869/978690
  try {
    API.abortController.abort(new DOMException("Aborted by navigation", "BeforeUnloadAbortError"));
    // reset new abort controller ?
    // API.abortController = new AbortController();
  } catch (e) {
    addToDebugMixedOrgsBug("Aborting requests failed", e);
    console.error(e);
  }
}

const App = () => {
  const user = useRecoilValue(userState);
  const initialLoadIsDone = useRecoilValue(initialLoadIsDoneState);
  const { refresh } = useDataLoader();
  const apiToken = API.getToken();

  // Abort all pending requests (that listen to this signal)
  useEffect(() => {
    window.addEventListener("beforeunload", abortRequests);
    return () => {
      window.removeEventListener("beforeunload", abortRequests);
    };
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      if (apiToken) {
        // Cela déclenchera un logout si la session est expirée
        tryFetch(() => API.getAbortable({ path: "/check-auth" })).then(() => {
          // On ne recharge que s'il y a une clé de chiffrement
          // Sinon ça met du bazar en cache (parce que ça va chercher des données chiffrées et que ça échoue)
          if (initialLoadIsDone && getHashedOrgEncryptionKey()) {
            refresh();
          }
        });
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [initialLoadIsDone, refresh, apiToken]);

  const showOutdateAlertBanner = useRecoilValue(showOutdateAlertBannerState);
  const deploymentCommit = useRecoilValue(deploymentCommitState);
  const deploymentDate = useRecoilValue(deploymentDateState);

  if (!user && showOutdateAlertBanner && !window.localStorage.getItem("automaticReload")) {
    addToDebugMixedOrgsBug("automatic force reload 🤖💪🆙");
    abortRequests();
    window.localStorage.setItem("deploymentDate", deploymentDate);
    window.localStorage.setItem("deploymentCommit", deploymentCommit);
    window.localStorage.setItem("automaticReload", "true"); //  to prevent infinite loop
    window.location.reload(true);
    return null;
  }

  return (
    <div className="main-container">
      <ToastContainer transition={import.meta.env.VITE_TEST_PLAYWRIGHT !== "true" ? Bounce : ToastifyFastTransition} />
      <VersionOutdatedAlert />
      {import.meta.env.VITE_TEST_PLAYWRIGHT === "true" && <DuplicatedReportsTestChecker />}
      <Router history={history}>
        <ScrollToTop />
        <Switch>
          <SentryRoute path="/auth" component={Auth} />
          <RestrictedRoute path="/charte" component={Charte} />
          <RestrictedRoute path="/account" component={Account} />
          <RestrictedRoute path="/user" component={User} />
          <RestrictedRoute path="/person" component={Person} />
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
          <RestrictedRoute path="*" component={() => <Redirect to={"stats"} />} />
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
  if (!!user && !user?.cgusAccepted)
    return (
      <main className="main">
        <SentryRoute {...rest} path="/auth" component={CGUs} />
      </main>
    );

  // Do not show content if loading state is fullscreen and user is logged in.
  if (user && fullScreen) return <div></div>;
  return (
    <>
      {!!user && <TopBar />}
      <div className="main">
        {!!user && !["superadmin", "stats-only"].includes(user.role) && <Drawer />}
        <main
          id="main-content"
          className="tw-relative tw-flex tw-grow tw-basis-full tw-flex-col tw-overflow-auto tw-overflow-x-hidden tw-overflow-y-scroll tw-px-2 sm:tw-px-12 sm:tw-pb-12 sm:tw-pt-4 print:!tw-ml-0 print:tw-h-auto print:tw-max-w-full print:tw-overflow-visible print:tw-p-0"
        >
          <SentryRoute {...rest} render={(props) => (user ? <Component {...props} /> : <Redirect to={{ pathname: "/auth" }} />)} />
        </main>
      </div>
      {!!user && !["superadmin", "stats-only"].includes(user.role) && <BottomBar />}
    </>
  );
};

export default function ContextedApp() {
  return (
    <RecoilRoot>
      {/* We need React.Suspense here because default values for `person`, `action` etc. tables is an async cache request */}
      {/* https://recoiljs.org/docs/guides/asynchronous-data-queries#query-default-atom-values */}
      <Suspense fallback={<div></div>}>
        {/* Recoil Nexus allows to use Recoil state outside React tree */}
        <RecoilNexus />
        <App />
      </Suspense>
    </RecoilRoot>
  );
}
