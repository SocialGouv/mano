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

  return (
    <Sidebar className="noprint" isOnboarding={onboardingForEncryption || onboardingForTeams}>
      <Nav>
        {!['superadmin'].includes(user.role) && (
          <>
            {!!organisation.receptionEnabled && (
              <li>
                <NavLink to="/reception" activeClassName="active">
                  Accueil
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/search" activeClassName="active">
                Recherche
              </NavLink>
            </li>
            <li>
              <NavLink to="/stats" activeClassName="active">
                Statistiques
              </NavLink>
            </li>
          </>
        )}
        <hr />
        {['admin'].includes(user.role) && (
          <li id="show-on-onboarding">
            <NavLink to={`/organisation/${organisation._id}`} activeClassName="active">
              Organisation
            </NavLink>
          </li>
        )}
        {['admin'].includes(user.role) && (
          <li id="show-on-onboarding">
            <NavLink to="/team" activeClassName="active">
              Équipes
            </NavLink>
          </li>
        )}
        {['admin'].includes(user.role) && (
          <React.Fragment>
            <li>
              <NavLink to="/user" activeClassName="active">
                Utilisateurs
              </NavLink>
            </li>
            <hr />
          </React.Fragment>
        )}
        {!['superadmin'].includes(user.role) && (
          <>
            <li>
              <NavLink to="/person" activeClassName="active">
                Personnes suivies
              </NavLink>
            </li>
            <li>
              <NavLink to="/action" activeClassName="active">
                Actions
              </NavLink>
            </li>
            <li>
              <NavLink to="/territory" activeClassName="active">
                Territoires
              </NavLink>
            </li>
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
            <li>
              <NavLink to="/report" activeClassName="active">
                Comptes rendus
              </NavLink>
            </li>
          </>
        )}
      </Nav>
      <Version>Version: {version}</Version>
    </Sidebar>
  );
};

const Sidebar = styled.aside`
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

const Version = styled.span`
  margin-top: auto;
  font-size: 0.65rem;
  display: block;
  color: ${theme.main};
`;

export default Drawer;
