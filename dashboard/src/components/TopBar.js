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
    <div className="tw-w-full">
      <aside
        className="noprint tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-between tw-bg-white tw-py-3 tw-px-5 print:tw-relative print:tw-hidden"
        title="Choix de l'équipe et menu déroulant pour le Profil">
        <div className="tw-flex tw-items-center tw-justify-start">
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
        <div className="tw-hidden lg:tw-flex">
          <div
            className="tw-mx-auto tw-my-0 tw-h-9 tw-w-14 tw-bg-cover tw-bg-center tw-bg-no-repeat"
            style={{
              backgroundImage: `url(${logo})`,
            }}
          />
        </div>
        <div className="tw-flex tw-justify-end [&_.dropdown-menu.show]:tw-z-[10000]">
          {!['restricted-access'].includes(user.role) && <Notification />}
          <ButtonDropdown direction="down" isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
            <DropdownToggleStyled>
              {user?.name}
              <div className="tw-ml-2.5 tw-flex tw-h-3 tw-w-3 tw-flex-col tw-justify-between">
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
        {Array.isArray(currentTeam?._id) ? teams.map((e) => <ColorHeadband key={e} teamId={e} />) : <ColorHeadband teamId={currentTeam?._id} />}
      </div>
    </div>
  );
};

const ColorHeadband = ({ teamId }) => {
  const teams = useRecoilValue(teamsState);
  const teamIndex = teams?.findIndex((t) => t._id === teamId);
  const team = teams[teamIndex];
  if (!team) return null;
  return (
    <div
      key={team?._id}
      style={{
        backgroundColor: teamsColors[teamIndex % teamsColors?.length],
        borderColor: borderColors[teamIndex % borderColors?.length],
      }}
      className="tw-border tw-py-0.5"></div>
  );
};

const teamsColors = ['#255c99cc', '#74776bcc', '#00c6a5cc', '#ff4b64cc', '#ef798acc'];
const borderColors = ['#255c99', '#74776b', '#00c6a5', '#ff4b64', '#ef798a'];

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

export default TopBar;
