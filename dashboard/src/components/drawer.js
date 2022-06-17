import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { version } from '../../package.json';
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
      </Nav>
      <Footer>
        <span>Version: {version}</span>
        <span>Accessibilité: partielle</span>
      </Footer>
    </Sidebar>
  );
};

const Sidebar = styled.nav`
  background-color: ${theme.white};
  flex-shrink: 0;
  max-width: 230px;
  flex-basis: 230px;
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
export default Drawer;
