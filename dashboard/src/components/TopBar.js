import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import logo from '../assets/logo-green.png';
import { RefreshButton } from '../components/header';
import SelectTeam from './SelectTeam';

import { theme } from '../config';

import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import API from '../services/api';
import { useRecoilState, useRecoilValue } from 'recoil';
import Notification from './Notification';
import { useDataLoader } from './DataLoader';
import OpenNewWindowIcon from './OpenNewWindowIcon';
import ColorHeaderBand from './ColorHeaderBand';

const TopBar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const [currentTeam, setCurrentTeam] = useRecoilState(currentTeamState);

  const { resetCache } = useDataLoader();

  return (
    <div className="tw-hidden tw-w-full sm:tw-block">
      <aside
        className="noprint tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-between tw-bg-white tw-py-3 tw-px-5 print:tw-relative print:tw-hidden"
        title="Choix de l'équipe et menu déroulant pour le Profil">
        <div className="tw-flex tw-flex-1 tw-items-center tw-justify-start">
          <div className="tw-mr-4 tw-w-max tw-text-left tw-text-sm tw-font-semibold tw-tracking-tighter">
            {['superadmin'].includes(user.role) ? 'Support' : organisation?.name}
          </div>
          {!['superadmin'].includes(user.role) && (
            <SelectTeam
              style={{ maxWidth: '250px', fontSize: '13px' }}
              onChange={setCurrentTeam}
              teamId={currentTeam?._id}
              teams={user.role === 'admin' ? teams : user.teams}
              inputId="team-selector-topBar"
            />
          )}
        </div>
        <div className="tw-hidden tw-flex-1 lg:tw-flex">
          <div
            className="tw-mx-auto tw-my-0 tw-h-9 tw-w-14 tw-bg-cover tw-bg-center tw-bg-no-repeat"
            style={{
              backgroundImage: `url(${logo})`,
            }}
          />
        </div>
        <div className="tw-flex tw-flex-1 tw-justify-end [&_.dropdown-menu.show]:tw-z-20">
          <Notification />
          <ButtonDropdown direction="down" isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
            <RefreshButton />
            <DropdownToggleStyled>
              {user?.name}
              <div className="tw-ml-2.5 tw-flex tw-h-3 tw-w-3 tw-flex-1 tw-flex-col tw-justify-between">
                <div className="tw-block tw-h-px tw-w-full tw-bg-white" />
                <div className="tw-block tw-h-px tw-w-full tw-bg-white" />
                <div className="tw-block tw-h-px tw-w-full tw-bg-white" />
              </div>
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
              <DropdownItem tag="a" href="/charte.pdf" target="_blank" rel="noreferrer">
                Charte des Utilisateurs <OpenNewWindowIcon />
              </DropdownItem>
              <DropdownItem tag="a" href="/legal-site.pdf" target="_blank" rel="noreferrer">
                Mentions Légales <OpenNewWindowIcon />
              </DropdownItem>
              <DropdownItem tag="a" href="/privacy.pdf" target="_blank" rel="noreferrer">
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
                  resetCache().then(() => {
                    return API.logout();
                  });
                }}>
                Se déconnecter et vider le cache
              </DropdownItem>
            </DropdownMenu>
          </ButtonDropdown>
        </div>
      </aside>
      <div className="tw-w-full">
        <ColorHeaderBand teamId={currentTeam?._id} />
      </div>
    </div>
  );
};

const DropdownToggleStyled = styled(DropdownToggle)`
  border-radius: 40px !important;
  padding: 4px 16px;
  display: flex;
  font-size: 12px;
  flex: 1;
  justify-content: space-between;
  align-items: center;
  background-color: ${theme.main};
  border-color: ${theme.main};
  margin: 0 0 0 1rem;
`;

export default TopBar;
