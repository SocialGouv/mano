import { useState } from "react";
import { Link } from "react-router-dom";
import { ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import logo from "../assets/logo-green-creux-plus-petit.png";
import SelectTeam from "./SelectTeam";

import { currentTeamState, organisationState, teamsState, userState } from "../recoil/auth";
import API, { tryFetchExpectOk } from "../services/api";
import { useRecoilState, useRecoilValue } from "recoil";
import Notification from "./Notification";
import { useDataLoader } from "./DataLoader";
import OpenNewWindowIcon from "./OpenNewWindowIcon";
import ColorHeaderBand from "./ColorHeaderBand";
import UnBugButton from "./UnBugButton";
import ModalCacheResetLoader from "./ModalCacheResetLoader";

const TopBar = () => {
  const [modalCacheOpen, setModalCacheOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const teams = useRecoilValue(teamsState);
  const [currentTeam, setCurrentTeam] = useRecoilState(currentTeamState);

  const { resetCache, refresh, isLoading } = useDataLoader();

  function resetCacheAndLogout() {
    // On affiche une fenêtre pendant notre vidage du cache pour éviter toute manipulation de la part des utilisateurs.
    setModalCacheOpen(true);
    resetCache("call ResetCache from TopBar.jsx").then(() => {
      tryFetchExpectOk(() => API.post({ path: "/user/logout" })).then(() => {
        // On met un timeout pour laisser le temps aux personnes de lire si jamais ça va trop vite.
        // Il n'a donc aucune utilité d'un point de vue code.
        setTimeout(() => {
          window.location.href = "/auth";
        }, 1500);
      });
    });
  }

  return (
    <div className="tw-hidden tw-w-full sm:tw-block">
      <aside
        className="noprint tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-between tw-bg-white tw-px-5 tw-py-3 print:tw-relative print:tw-hidden"
        title="Choix de l'équipe et menu déroulant pour le Profil"
      >
        <div className="tw-flex tw-flex-1 tw-items-center tw-justify-start">
          <div className="tw-mr-4 tw-w-max tw-text-left tw-text-sm tw-font-semibold tw-tracking-tighter">
            {["superadmin"].includes(user.role) ? "🤖 Mano Superadmin Console" : organisation?.name}
          </div>
          {!["superadmin"].includes(user.role) && (
            <SelectTeam
              style={{ maxWidth: "250px", fontSize: "13px" }}
              onChange={setCurrentTeam}
              teamId={currentTeam?._id}
              teams={user.role === "admin" ? teams : user.teams}
              inputId="team-selector-topBar"
            />
          )}
        </div>
        <div className="tw-hidden tw-flex-1 lg:tw-flex">
          <button
            className="tw-mx-auto tw-my-0 tw-h-9 tw-w-14 tw-bg-center tw-bg-no-repeat disabled:tw-opacity-30 tw-bg-contain"
            type="button"
            title="Cliquez ici pour rafraîchir les données"
            onClick={refresh}
            disabled={isLoading}
            style={{
              backgroundImage: `url(${logo})`,
            }}
          />
        </div>
        <div className="tw-flex tw-flex-1 tw-justify-end tw-gap-x-4 [&_.dropdown-menu.show]:tw-z-20">
          {!["stats-only"].includes(user.role) ? <Notification /> : null}
          <UnBugButton onResetCacheAndLogout={resetCacheAndLogout} />
          <ButtonDropdown direction="down" isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
            <DropdownToggle className="tw-ml-2.5 !tw-inline-flex tw-flex-1 tw-items-center tw-justify-between tw-gap-x-2.5 !tw-rounded-full tw-border-main tw-bg-main !tw-px-4 tw-py-1 tw-text-xs">
              <span>{user?.name}</span>
              <div className="tw-inline-flex tw-h-3 tw-w-3 tw-flex-1 tw-flex-col tw-justify-between">
                <div className="tw-block tw-h-px tw-w-full tw-bg-white" />
                <div className="tw-block tw-h-px tw-w-full tw-bg-white" />
                <div className="tw-block tw-h-px tw-w-full tw-bg-white" />
              </div>
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem header disabled>
                {user?.name} - {user.role}
              </DropdownItem>
              <DropdownItem divider />
              <DropdownItem tag="a" href="https://mano.sesan.fr/faq/" target="_blank" rel="noreferrer">
                Besoin d'aide ? <OpenNewWindowIcon />
              </DropdownItem>
              <DropdownItem divider />
              <DropdownItem
                tag="a"
                target="_blank"
                rel="noreferrer"
                href="https://framaforms.org/nouveau-questionnaire-de-satisfaction-de-mano-1627635427"
              >
                Donner mon avis sur Mano <OpenNewWindowIcon />
              </DropdownItem>
              <DropdownItem tag="a" href="/charte.pdf" target="_blank" rel="noreferrer">
                Charte des Utilisateurs <OpenNewWindowIcon />
              </DropdownItem>
              <DropdownItem tag="a" href="/legal.pdf" target="_blank" rel="noreferrer">
                Mentions Légales <OpenNewWindowIcon />
              </DropdownItem>
              <DropdownItem tag="a" href="/cgu.pdf" target="_blank" rel="noreferrer">
                Conditions générales d'utilisation <OpenNewWindowIcon />
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
                  tryFetchExpectOk(() => API.post({ path: "/user/logout" })).then(() => {
                    window.location.href = "/auth";
                  });
                }}
              >
                Se déconnecter
              </DropdownItem>
              <DropdownItem onClick={resetCacheAndLogout}>Se déconnecter et vider le cache</DropdownItem>
            </DropdownMenu>
          </ButtonDropdown>
        </div>
      </aside>
      <div className="tw-w-full">
        <ColorHeaderBand teamId={currentTeam?._id} />
      </div>
      {modalCacheOpen ? <ModalCacheResetLoader /> : null}
    </div>
  );
};

export default TopBar;
