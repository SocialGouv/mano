import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import packageInfo from '../../package.json';
import { organisationState, teamsState, userState } from '../recoil/auth';
import OpenNewWindowIcon from './OpenNewWindowIcon';
import SessionCountDownLimiter from './SessionCountDownLimiter';
import API from '../services/api';

const Drawer = () => {
  const [user, setUser] = useRecoilState(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);

  const onboardingForEncryption = !organisation.encryptionEnabled;
  const onboardingForTeams = !teams.length;
  const role = user.role;

  const isOnboarding = onboardingForEncryption || onboardingForTeams;
  const [feedbacks, setFeedbacks] = React.useState(0);

  useEffect(() => {
    API.get({ path: '/public/feedbacks' }).then((res) => {
      if (res.ok) {
        setFeedbacks(res.data);
      }
    });
  }, []);

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
        {['admin', 'normal'].includes(role) && (
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
        {['admin', 'normal'].includes(role) && !!organisation.territoriesEnabled && (
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
        {!user.gaveFeedbackEarly2023 && (
          <>
            <a
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                API.put({ path: '/user', body: { gaveFeedbackEarly2023: true } }).then((res) => {
                  if (res.ok) {
                    setUser(res.user);
                  }
                });
              }}
              href="https://docs.google.com/forms/d/e/1FAIpQLScnizjlH0dCJ-wa-xeiZJcmemrKqiDkDo5linLwtCUjwr3uzg/viewform?usp=sf_link"
              className="tw-relative !tw-mt-4 tw-cursor-pointer tw-rounded-md tw-border-black !tw-bg-main !tw-text-white hover:!tw-opacity-100 motion-safe:tw-animate-brrrr">
              <div className="tw-absolute -tw-top-2 -tw-left-2 tw-text-2xl motion-safe:tw-animate-coucou">👋</div>
              <div className="tw-px-2 tw-py-4 tw-text-center tw-text-xs tw-font-semibold">
                Hep&nbsp;! Auriez-vous une minute à nous accorder pour améliorer Mano&nbsp;?
              </div>
            </a>
            <div className="tw-mt-1 tw-h-1 tw-w-full tw-rounded-full tw-bg-gray-200">
              <div className="tw-h-1 tw-rounded-full tw-bg-main" style={{ width: `${(feedbacks.count / feedbacks.totalUsers) * 100}%` }} />
            </div>
            <small className="tw-block tw-text-[0.65rem] tw-text-main">
              {feedbacks.count} sur {feedbacks.totalUsers} à récolter
            </small>
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
