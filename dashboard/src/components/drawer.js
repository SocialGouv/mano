import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import logo from '../assets/logo-green.png';

import SelectTeam from './SelectTeam';

import { theme } from '../config';

import legal from '../assets/legal.pdf';
import privacy from '../assets/privacy.pdf';
import charte from '../assets/charte.pdf';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import useApi from '../services/api';
import { useRecoilState, useRecoilValue } from 'recoil';

const Drawer = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const [currentTeam, setCurrentTeam] = useRecoilState(currentTeamState);
  const API = useApi();

  const onboardingForTeams = !teams.length;

  return (
    <>
      <Sidebar className="noprint" onboardingForTeams={onboardingForTeams}>
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
            <li>
              <NavLink to={`/organisation/${organisation._id}`} activeClassName="active">
                Organisation
              </NavLink>
            </li>
          )}
          {['admin'].includes(user.role) && (
            <li id="teams">
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
      </Sidebar>
      <TopBar className="topBar">
        <TopBarOrganistionTeamBox>
          <Organisation>{['superadmin'].includes(user.role) ? 'Support' : organisation?.name}</Organisation>
          {!['superadmin'].includes(user.role) && (
            <SelectTeam
              style={{ maxWidth: '250px', fontSize: '13px' }}
              onChange={setCurrentTeam}
              teamId={currentTeam?._id}
              teams={user.role === 'admin' ? teams : user.teams}
            />
          )}
        </TopBarOrganistionTeamBox>
        <TopBarLogo>
          <Logo size={60} />
        </TopBarLogo>
        <TopBarAccount>
          <ButtonDropdown direction="left" isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
            <DropdownToggleStyled>
              {user?.name}
              <Burger>
                <div />
                <div />
                <div />
              </Burger>
            </DropdownToggleStyled>
            <DropdownMenu>
              <DropdownItem header disabled>
                {user?.name}
              </DropdownItem>
              <DropdownItem header disabled>
                Role : {user.role}
              </DropdownItem>
              <DropdownItem divider />
              <DropdownItem tag={Link} to="/account">
                Mon compte
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  API.logout();
                }}>
                Se déconnecter
              </DropdownItem>
              <DropdownItem divider />
              <DropdownItem
                tag="a"
                target="_blank"
                rel="noreferrer"
                href="https://framaforms.org/nouveau-questionnaire-de-satisfaction-de-mano-1627635427">
                Donner mon avis sur Mano
              </DropdownItem>
              <DropdownItem tag="a" href={charte} target="_blank" rel="noreferrer">
                Charte des Utilisateurs
              </DropdownItem>
              <DropdownItem tag="a" href={legal} target="_blank" rel="noreferrer">
                Mentions Légales
              </DropdownItem>
              <DropdownItem tag="a" href={privacy} target="_blank" rel="noreferrer">
                Politique de Confidentialité
              </DropdownItem>
            </DropdownMenu>
          </ButtonDropdown>
        </TopBarAccount>
      </TopBar>
    </>
  );
};

const TopBarLogo = styled.div`
  @media (max-width: 1024px) {
    display: none;
  }
`;

const TopBarAccount = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const TopBarOrganistionTeamBox = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const Sidebar = styled.div`
  background-color: ${theme.white};
  height: 100%;
  max-width: 230px;
  width: 100%;
  z-index: 9;
  position: fixed;
  left: 0;
  top: 60px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.1);

  ${(p) =>
    p.onboardingForTeams &&
    `
    li:not(#teams) {
      opacity: 0.2;
      pointer-events: none;
    }
  `}
`;

const TopBar = styled.div`
  background-color: ${theme.white};
  z-index: 10;
  position: fixed;
  width: 100%;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  > div {
    flex: 1;
  }
  @media print {
    left: 0;
    position: relative;
  }
`;

const Logo = styled.div`
  width: ${(props) => props.size}px;
  height: ${(props) => (props.size * 2) / 3}px;
  margin: 0 auto;
  background-image: url(${logo});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
`;

const Organisation = styled.div`
  font-weight: 600;
  width: max-content;
  font-size: 14px;
  line-height: 22px;
  margin-right: 1rem;
  text-align: left;
  letter-spacing: -0.01em;
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

const DropdownToggleStyled = styled(DropdownToggle)`
  border-radius: 40px !important;
  padding: 0px 20px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${theme.main};
  border-color: ${theme.main};
  transform: scale(0.75);
`;

const Burger = styled.div`
  width: 25px;
  margin-left: 10px;
  height: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transform: scale(0.8);
  div {
    height: 2px;
    width: 100%;
    background-color: #fff;
    display: block;
  }
`;

export default Drawer;
