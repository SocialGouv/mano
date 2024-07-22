import { NavLink } from "react-router-dom";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { organisationState, teamsState, usersLastLoginMoreThan6MonthsSelector, userState, usersTooManyDecryptAttempsSelector } from "../recoil/auth";
import OpenNewWindowIcon from "./OpenNewWindowIcon";
import SessionCountDownLimiter from "./SessionCountDownLimiter";
import useMinimumWidth from "../services/useMinimumWidth";
import { deploymentShortCommitSHAState } from "../recoil/version";
import AddPersons from "./AddPersons";

export const showDrawerState = atom({
  key: "showDrawerState",
  default: false,
});

const Drawer = () => {
  const user = useRecoilValue(userState);
  const usersLastLoginMoreThan6Months = useRecoilValue(usersLastLoginMoreThan6MonthsSelector);
  const usersTooManyDecryptAttemps = useRecoilValue(usersTooManyDecryptAttempsSelector);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const deploymentCommit = useRecoilValue(deploymentShortCommitSHAState);

  const onboardingForEncryption = !organisation.encryptionEnabled;
  const onboardingForTeams = !teams.length;
  const role = user.role;

  const isOnboarding = onboardingForEncryption || onboardingForTeams;
  const [showDrawer, setShowDrawer] = useRecoilState(showDrawerState);

  const isDesktop = useMinimumWidth("sm");

  return (
    <nav
      title="Navigation principale"
      className={[
        "noprint tw-absolute tw-flex tw-h-screen tw-w-screen tw-overflow-hidden tw-bg-gray-900/80 tw-opacity-100 tw-transition-all sm:!tw-pointer-events-auto sm:!tw-visible sm:tw-relative sm:!tw-z-30 sm:tw-h-auto sm:tw-w-auto sm:tw-translate-x-0 sm:tw-bg-transparent",
        showDrawer ? "tw-visible tw-z-30 tw-translate-x-0 tw-transition-all" : "tw-pointer-events-none tw-invisible tw-z-[-1] -tw-translate-x-full",
      ].join(" ")}
    >
      <div
        className={[
          "noprint tw-max-h-full tw-w-64 tw-min-w-min tw-shrink-0 tw-basis-52 tw-flex-col tw-justify-between tw-overflow-y-auto tw-border-r tw-border-black tw-border-opacity-10 tw-bg-white tw-p-4 tw-drop-shadow-xl sm:!tw-flex sm:tw-drop-shadow-none",
          isOnboarding ? "[&_li:not(#show-on-onboarding)]:tw-pointer-events-none [&_li:not(#show-on-onboarding)]:tw-opacity-20" : "",
        ].join(" ")}
      >
        <div className="tw-pl-0 [&_a.active]:tw-text-main [&_a.active]:tw-underline [&_a:hover]:tw-text-main [&_a]:tw-my-0.5 [&_a]:tw-block [&_a]:tw-rounded-lg [&_a]:tw-py-0.5 [&_a]:tw-text-sm [&_a]:tw-font-semibold [&_a]:tw-text-black75 [&_li]:tw-list-none">
          {["admin", "normal"].includes(role) && isDesktop && (
            <>
              <li>
                <NavLink to="/search" activeClassName="active">
                  &#128269; Recherche
                </NavLink>
              </li>
              <hr />
            </>
          )}
          {["admin", "normal", "restricted-access"].includes(role) && !!organisation.receptionEnabled && !!isDesktop && (
            <li>
              <NavLink to="/reception" activeClassName="active">
                Accueil
              </NavLink>
            </li>
          )}
          {["admin", "normal", "restricted-access"].includes(role) && (
            <li>
              <NavLink to="/action" activeClassName="active">
                Agenda
              </NavLink>
            </li>
          )}
          {["admin", "normal", "restricted-access"].includes(role) && (
            <li>
              <NavLink to="/person" activeClassName="active">
                Personnes suivies
              </NavLink>
            </li>
          )}
          {["admin", "normal", "restricted-access"].includes(role) && !!organisation.territoriesEnabled && (
            <li>
              <NavLink to="/territory" activeClassName="active">
                Territoires
              </NavLink>
            </li>
          )}
          {["admin", "normal", "restricted-access"].includes(role) && (
            <>
              <li>
                <NavLink to="/report-new" activeClassName="active">
                  Comptes rendus
                </NavLink>
              </li>
            </>
          )}
          {["admin", "normal", "restricted-access"].includes(role) && (
            <>
              <hr />
              {/* <li>
              <NavLink to="/place" activeClassName="active">
                Lieux fréquentés
              </NavLink>
            </li> */}
              <li>
                <NavLink to="/structure" activeClassName="active">
                  Structures
                </NavLink>
              </li>
              <li>
                <a href="https://soliguide.fr/" target="_blank" rel="noreferrer">
                  Soliguide <OpenNewWindowIcon />
                </a>
              </li>
              <hr />
            </>
          )}
          {["admin", "normal"].includes(role) && isDesktop && (
            <>
              <li>
                <NavLink to="/stats" activeClassName="active">
                  Statistiques
                </NavLink>
              </li>
            </>
          )}
          {["admin"].includes(role) && isDesktop && (
            <>
              <hr />
              <li id="show-on-onboarding">
                <NavLink to={`/organisation/${organisation._id}`} activeClassName="active">
                  Organisation
                </NavLink>
              </li>
              <li id="show-on-onboarding">
                <NavLink to="/team" activeClassName="active">
                  Équipes
                </NavLink>
              </li>
              <li>
                <NavLink to="/user" activeClassName="active">
                  Utilisateurs
                  {usersLastLoginMoreThan6Months >= 1 && (
                    <>
                      <br />
                      <small className="tw-text-red-500">
                        ⚠️ {usersLastLoginMoreThan6Months} {usersLastLoginMoreThan6Months === 1 ? "utilisateur inactif" : "utilisateurs inactifs"}
                      </small>
                    </>
                  )}
                  {usersTooManyDecryptAttemps >= 1 && (
                    <>
                      <br />
                      <small className="tw-text-red-500 tw-font-bold">
                        ⚠️ {usersTooManyDecryptAttemps} {usersTooManyDecryptAttemps === 1 ? "utilisateur bloqué" : "utilisateurs bloqués"}
                      </small>
                    </>
                  )}
                </NavLink>
              </li>
              {import.meta.env.VITE_ADD_MULTIPLE_PERSONS_BUTTON === "true" && (
                <>
                  <hr />
                  <li>
                    <AddPersons />
                  </li>
                </>
              )}
            </>
          )}
        </div>
        <div className="tw-mb-4 tw-mt-auto tw-flex tw-flex-col tw-justify-between tw-text-[0.65rem] tw-text-main">
          <p className="m-0">Version&nbsp;: {deploymentCommit}</p>
          <p className="m-0">Accessibilité&nbsp;: partielle</p>
          <SessionCountDownLimiter />
        </div>
        <button
          type="button"
          aria-label="Cacher la navigation latérale"
          className="tw-absolute tw-right-2 tw-top-2 tw-text-gray-900 sm:tw-hidden sm:tw-px-6"
          onClick={() => setShowDrawer(!showDrawer)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="tw-h-6 tw-w-6">
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Drawer;
