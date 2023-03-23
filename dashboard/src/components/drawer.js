import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import packageInfo from '../../package.json';
import { organisationState, teamsState, userState } from '../recoil/auth';
import OpenNewWindowIcon from './OpenNewWindowIcon';
import SessionCountDownLimiter from './SessionCountDownLimiter';

const Drawer = () => {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);

  const onboardingForEncryption = !organisation.encryptionEnabled;
  const onboardingForTeams = !teams.length;
  const role = user.role;

  const isOnboarding = onboardingForEncryption || onboardingForTeams;

  return (
    <nav
      className={[
        'noprint tw-flex tw-max-w-max tw-shrink-0 tw-basis-52 tw-flex-col tw-justify-between tw-overflow-y-auto tw-border-r tw-border-black tw-border-opacity-10 tw-bg-white tw-p-4',
        isOnboarding ? '[&_li:not(#show-on-onboarding)]:tw-pointer-events-none [&_li:not(#show-on-onboarding)]:tw-opacity-20' : '',
      ].join(' ')}
      title="Navigation principale">
      <div className="[&_li]:tw-list-none [&_a]:tw-my-0.5 [&_a]:tw-block [&_a]:tw-rounded-lg [&_a]:tw-py-0.5 [&_a]:tw-text-sm [&_a]:tw-font-semibold [&_a]:tw-text-black75 [&_a:active]:tw-text-main [&_a:hover]:tw-text-main">
        {['admin', 'normal'].includes(role) && (
          <>
            <li>
              <NavLink to="/search" activeClassName="active">
                &#128269; Recherche
              </NavLink>
            </li>
            <hr />
          </>
        )}
        {['admin', 'normal', 'restricted-access'].includes(role) && !!organisation.receptionEnabled && (
          <li>
            <NavLink to="/reception" activeClassName="active">
              Accueil
            </NavLink>
          </li>
        )}
        {['admin', 'normal', 'restricted-access'].includes(role) && (
          <li>
            <NavLink to="/action" activeClassName="active">
              Agenda
            </NavLink>
          </li>
        )}
        {['admin', 'normal', 'restricted-access'].includes(role) && (
          <li>
            <NavLink to="/person" activeClassName="active">
              Personnes suivies
            </NavLink>
          </li>
        )}
        {['admin', 'normal', 'restricted-access'].includes(role) && !!organisation.territoriesEnabled && (
          <li>
            <NavLink to="/territory" activeClassName="active">
              Territoires
            </NavLink>
          </li>
        )}
        {['admin', 'normal', 'restricted-access'].includes(role) && (
          <>
            <li>
              <NavLink to="/report" activeClassName="active">
                Comptes rendus
              </NavLink>
            </li>
          </>
        )}
        {['admin', 'normal'].includes(role) && (
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
        {['admin', 'normal'].includes(role) && (
          <>
            <li>
              <NavLink to="/stats" activeClassName="active">
                Statistiques
              </NavLink>
            </li>
          </>
        )}
        {['admin'].includes(role) && (
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
              </NavLink>
            </li>
          </>
        )}
      </div>
      <div className="tw-mt-auto tw-mb-4 tw-flex tw-flex-col tw-justify-between tw-text-[0.65rem] tw-text-main">
        <p className="m-0">Version&nbsp;: {packageInfo.version}</p>
        <p className="m-0">Accessibilité&nbsp;: partielle</p>
        <SessionCountDownLimiter />
      </div>
    </nav>
  );
};

export default Drawer;
