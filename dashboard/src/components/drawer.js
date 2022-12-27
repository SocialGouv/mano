import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import packageInfo from '../../package.json';
import openNewWindow from '../assets/icons/open-in-new-window.svg';

import { theme } from '../config';

import { organisationState, teamsState, userState } from '../recoil/auth';
import { useRecoilValue } from 'recoil';

const Drawer = () => {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);

  const onboardingForEncryption = !organisation.encryptionEnabled;
  const onboardingForTeams = !teams.length;
  const role = user.role;

  return (
    <Sidebar className="noprint" isOnboarding={onboardingForEncryption || onboardingForTeams} title="Navigation principale">
      <Nav>
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
        {['admin', 'normal'].includes(role) && (
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
            <li>
              <NavLink to="/place" activeClassName="active">
                Lieux fréquentés
              </NavLink>
            </li>
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
        <a
          target="_blank"
          rel="noreferrer"
          href="https://docs.google.com/forms/d/e/1FAIpQLScnizjlH0dCJ-wa-xeiZJcmemrKqiDkDo5linLwtCUjwr3uzg/viewform?usp=sf_link"
          className="tw-relative !tw-mt-4 tw-cursor-pointer tw-rounded-md tw-border-black !tw-bg-main !tw-text-white hover:!tw-opacity-100">
          <div className="tw-absolute -tw-top-2 -tw-left-2 tw-text-2xl">👋</div>
          <div className="tw-px-2 tw-py-4 tw-text-center tw-text-xs tw-font-semibold">
            Hep&nbsp;! Auriez-vous une minute à nous accorder pour améliorer Mano&nbsp;?
          </div>
        </a>
      </Nav>
      <Footer>
        <span>Version: {packageInfo.version}</span>
        <span>Accessibilité: partielle</span>
      </Footer>
    </Sidebar>
  );
};

const Sidebar = styled.nav`
  background-color: ${theme.white};
  flex-shrink: 0;
  max-width: 210px;
  flex-basis: 210px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.1);

  ${(p) =>
    p.isOnboarding &&
    `
    li:not(#show-on-onboarding) {
      opacity: 0.2;
      pointer-events: none;
    }
  `}
`;

const Nav = styled.div`
  a {
    text-decoration: none;
    padding: 0px;
    display: block;
    border-radius: 8px;
    color: ${theme.black75};
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 24px;
    margin: 2px 0;
  }
  a.active,
  a:hover {
    background-color: ${theme.mainLight};
    color: ${theme.main};
  }
  a:hover {
    opacity: 0.6;
  }
  li {
    list-style-type: none;
  }
`;
const Footer = styled.p`
  margin-top: auto;
  font-size: 0.65rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: ${theme.main};
`;

const OpenNewWindowIcon = styled.div`
  color: currentColor;
  background-image: url(${openNewWindow});
  background-size: contain;
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-left: 0.25rem;
`;
export default Drawer;
