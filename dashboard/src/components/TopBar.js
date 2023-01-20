import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import logo from '../assets/logo-green.png';

import SelectTeam from './SelectTeam';

import { theme } from '../config';

import legal from '../assets/legal.pdf';
import privacy from '../assets/privacy.pdf';
import charte from '../assets/charte.pdf';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import API from '../services/api';
import { useRecoilState, useRecoilValue } from 'recoil';
import Notification from './Notification';
import { toast } from 'react-toastify';
import { useDataLoader } from './DataLoader';
import OpenNewWindowIcon from './OpenNewWindowIcon';

const TopBar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const [currentTeam, setCurrentTeam] = useRecoilState(currentTeamState);

  const { resetCache } = useDataLoader();

  return (
    <TopBarStyled className="noprint" title="Choix de l'équipe et menu déroulant pour le Profil">
      <TopBarOrganistionTeamBox>
        <Organisation>{['superadmin'].includes(user.role) ? 'Support' : organisation?.name}</Organisation>
        {!['superadmin'].includes(user.role) && (
          <SelectTeam
            style={{ maxWidth: '250px', fontSize: '13px' }}
            onChange={setCurrentTeam}
            teamId={currentTeam?._id}
            teams={user.role === 'admin' ? teams : user.teams}
            inputId="team-selector-topBar"
          />
        )}
      </TopBarOrganistionTeamBox>
      <TopBarLogo>
        <Logo size={60} />
      </TopBarLogo>

      <TopBarAccount>
        {!['restricted-access'].includes(user.role) && <Notification />}
        <ButtonDropdown direction="down" isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
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
              {user?.name} - {user.role}
            </DropdownItem>
            <DropdownItem divider />
            <DropdownItem tag="a" href="https://mano-app.fabrique.social.gouv.fr/faq/" target="_blank" rel="noreferrer">
              Besoin d'aide ? <OpenNewWindowIcon />
            </DropdownItem>
            <DropdownItem divider />
            <DropdownItem
              tag="a"
              target="_blank"
              rel="noreferrer"
              href="https://framaforms.org/nouveau-questionnaire-de-satisfaction-de-mano-1627635427">
              Donner mon avis sur Mano <OpenNewWindowIcon />
            </DropdownItem>
            <DropdownItem tag="a" href={charte} target="_blank" rel="noreferrer">
              Charte des Utilisateurs <OpenNewWindowIcon />
            </DropdownItem>
            <DropdownItem tag="a" href={legal} target="_blank" rel="noreferrer">
              Mentions Légales <OpenNewWindowIcon />
            </DropdownItem>
            <DropdownItem tag="a" href={privacy} target="_blank" rel="noreferrer">
              Politique de Confidentialité <OpenNewWindowIcon />
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
            <DropdownItem
              onClick={() => {
                resetCache()
                  .then(() => {
                    return API.logout();
                  })
              }}>
              Se déconnecter et supprimer toute trace de mon passage
            </DropdownItem>
          </DropdownMenu>
        </ButtonDropdown>
      </TopBarAccount>
    </TopBarStyled>
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
  .dropdown-menu.show {
    z-index: 10000;
  }
`;

const TopBarOrganistionTeamBox = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const TopBarStyled = styled.aside`
  background-color: ${theme.white};
  width: 100%;
  padding: 12px 18px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  > div {
    flex: 1;
  }
  @media print {
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

const DropdownToggleStyled = styled(DropdownToggle)`
  border-radius: 40px !important;
  padding: 4px 16px;
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  align-items: center;
  background-color: ${theme.main};
  border-color: ${theme.main};
  margin: 0 0 0 1rem;
`;

const Burger = styled.div`
  width: 12px;
  margin-left: 10px;
  height: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  div {
    height: 1px;
    width: 100%;
    background-color: #fff;
    display: block;
  }
`;

export default TopBar;
