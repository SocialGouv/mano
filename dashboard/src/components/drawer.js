import React, { useContext, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import logo from '../assets/logo-green.png';

import SelectTeam from './SelectTeam';

import { theme } from '../config';
import API from '../services/api';

import legal from '../assets/legal.pdf';
import privacy from '../assets/privacy.pdf';
import charte from '../assets/charte.pdf';
import AuthContext from '../contexts/auth';

const Drawer = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, organisation, teams, currentTeam, setCurrentTeam } = useContext(AuthContext);

  return (
    <>
      <Sidebar className="noprint">
        <Nav>
          <div style={{ marginBottom: 30, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Logo size={100} hide />
            {!['superadmin'].includes(user.role) && (
              <SelectTeam onChange={setCurrentTeam} teamId={currentTeam?._id} teams={user.role === 'admin' ? teams : user.teams} />
            )}
          </div>
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
          {/* ["superadmin"].includes(user.role) && (
          <li>
            <NavLink to="/organisation" activeClassName="active">
              Organisations
            </NavLink>
          </li>
        ) */}
          {['admin'].includes(user.role) && (
            <li>
              <NavLink to={`/organisation/${organisation._id}`} disabled activeClassName="active">
                Organisation
              </NavLink>
            </li>
          )}
          {['admin'].includes(user.role) && (
            <li>
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
        <Organisation>{['superadmin'].includes(user.role) ? 'Support' : organisation?.name}</Organisation>
        <Logo size={60} noMargin />
        <div>
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
                  API.resetAuth();
                  window.location.replace('/auth');
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
        </div>
      </TopBar>
    </>
  );
};

const Sidebar = styled.div`
  background-color: ${theme.white};
  height: 100%;
  max-width: 230px;
  width: 100%;
  z-index: 10;
  position: fixed;
  left: 0;
  top: 0;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`;

const TopBar = styled.div`
  background-color: ${theme.white};
  z-index: 9;
  position: fixed;
  left: 230px;
  right: 0;
  top: 0;
  padding: 5px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  @media print {
    left: 0;
    position: relative;
  }
`;

const Logo = styled.div`
  width: ${(props) => props.size}px;
  height: ${(props) => (props.size * 2) / 3}px;
  ${(props) => props.hide && 'display: none;'}
  margin-bottom: 20px;
  ${(props) => props.noMargin && 'margin: 0;'}
  background-image: url(${logo});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
`;

const Organisation = styled.span`
  font-weight: 600;
  font-size: 14px;
  line-height: 22px;
  text-align: center;
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
