import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../config';
import { useRecoilValue } from 'recoil';
import { currentTeamState, organisationState, userState } from '../recoil/auth';
// import useMinimumWidth from '../services/useMinimumWidth';

export default function Drawer() {
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const team = useRecoilValue(currentTeamState);

  // const onboardingForEncryption = !organisation.encryptionEnabled;
  // const onboardingForTeams = !teams.length;
  // const role = user.role;

  // const isOnboarding = onboardingForEncryption || onboardingForTeams;
  // const [showDrawer, setShowDrawer] = useRecoilState(showDrawerState);

  // const isDesktop = useMinimumWidth('sm');

  return (
    <Sidebar>
      <Nav>
        <Profile>
          <Name>{user && user.name}</Name>
          {team?.length && team.map((t) => <Team key={t._id}>{t.name}</Team>)}
          <Organisation>{organisation?.name}</Organisation>
        </Profile>
        <br />
        <li>
          <NavLink to="/home" activeClassName="active">
            Accueil
          </NavLink>
        </li>
        <hr />
        <li>
          <NavLink to="/organisation" activeClassName="active" className="tw-pointer-events-none tw-opacity-20">
            Organisations
          </NavLink>
        </li>
        <li>
          <NavLink to="/team" activeClassName="active" className="tw-pointer-events-none tw-opacity-20">
            Équipes
          </NavLink>
        </li>
        <li>
          <NavLink to="/user" activeClassName="active" className="tw-pointer-events-none tw-opacity-20">
            Utilisateurs
          </NavLink>
        </li>
        <hr />
        <li>
          <NavLink to="/person" activeClassName="active">
            Usagers
          </NavLink>
        </li>
        <li>
          <NavLink to="/action" activeClassName="active">
            Actions
          </NavLink>
        </li>
        <li>
          <NavLink to="/place" activeClassName="active" className="tw-pointer-events-none tw-opacity-20">
            Hébergement
          </NavLink>
        </li>
        <li>
          <NavLink to="/structure" activeClassName="active" className="tw-pointer-events-none tw-opacity-20">
            Structures
          </NavLink>
        </li>
      </Nav>
    </Sidebar>
  );
}

const Profile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
`;

const Sidebar = styled.div`
  background-color: ${theme.white};
  height: 100%;
  max-width: 260px;
  width: 100%;
  z-index: 10;
  position: fixed;
  left: 0;
  top: 0;
  padding: 32px 18px;
`;

const Name = styled.div`
  font-weight: bold;
  font-size: 20px;
  line-height: 28px;

  text-align: center;
  color: ${theme.main};
`;

const Team = styled.div`
  font-weight: 600;
  font-size: 14px;
  line-height: 22px;
  text-align: center;
  letter-spacing: -0.01em;
`;
const Organisation = styled.div`
  font-weight: 600;
  font-size: 14px;
  line-height: 22px;
  text-align: center;
  letter-spacing: -0.01em;
`;

const Nav = styled.div`
  a {
    text-decoration: none;
    padding: 16px;
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
