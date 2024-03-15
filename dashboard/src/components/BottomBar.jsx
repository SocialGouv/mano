import { NavLink } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import AgendaIcon from "../assets/icons/AgendaIcon";
import TerritoryIcon from "../assets/icons/TerritoryIcon";
import PersonIcon from "../assets/icons/PersonIcon";
import Notification from "./Notification";
import DotsIcon from "../assets/icons/DotsIcon";
import { showDrawerState } from "./drawer";

export default function BottomBar() {
  const setShowDrawer = useSetRecoilState(showDrawerState);
  return (
    <nav
      title="Tab bar pour navigation sur mobile"
      aria-labelledby="bottom tab bar"
      className={[
        "noprint tw-flex tw-w-full tw-shrink-0 tw-justify-between tw-overflow-hidden tw-border-t tw-border-black tw-border-opacity-10 tw-bg-white tw-px-1 tw-pt-3 tw-text-[10px] tw-text-main sm:tw-hidden [&_*.active]:tw-font-semibold [&_*.active]:tw-text-main [&_*.active]:tw-opacity-100 [&_*]:tw-opacity-80",
      ].join(" ")}
    >
      <NavLink
        to="/action"
        activeClassName="active"
        className="tw-flex tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-items-center tw-justify-between tw-gap-2"
      >
        <AgendaIcon size={20} />
        Agenda
      </NavLink>
      <NavLink
        to="/person"
        activeClassName="active"
        className="tw-flex tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-items-center tw-justify-between tw-gap-2"
      >
        <PersonIcon size={20} />
        Personnes
      </NavLink>
      <NavLink
        to="/territory"
        activeClassName="active"
        className="tw-flex tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-items-center tw-justify-between tw-gap-2"
      >
        <TerritoryIcon size={23} />
        Territoires
      </NavLink>
      <div className="tw-flex tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-items-center tw-justify-between tw-gap-2">
        <Notification />
        Priorités
      </div>
      <button
        type="button"
        className="tw-flex tw-shrink-0 tw-grow tw-basis-0 tw-flex-col tw-items-center tw-justify-between tw-gap-2 tw-uppercase"
        onClick={() => setShowDrawer(true)}
      >
        <DotsIcon size={20} />
        Menu
      </button>
    </nav>
  );
}
