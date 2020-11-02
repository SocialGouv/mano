import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

export default () => {
  return (
    <Sidebar>
      <Nav>
        <li>
          <NavLink to="/" activeClassName="active">
            Tableau de bord
          </NavLink>
        </li>
        <li>
          <NavLink to="/organisation" activeClassName="active">
            Organisations
          </NavLink>
        </li>
        <li>
          <NavLink to="/team" activeClassName="active">
            Teams
          </NavLink>
        </li>
        <li>
          <NavLink to="/user" activeClassName="active">
            Users
          </NavLink>
        </li>
      </Nav>
    </Sidebar>
  );
};

const Sidebar = styled.div`
  background-color: #2e3444;
  height: 100%;
  max-width: 160px;
  width: 100%;
  z-index: 10;
  position: fixed;
  left: 0;
  top: 0;
`;

const Nav = styled.div`
  a {
    text-decoration: none;
    padding: 15px 20px 10px;
    display: block;
    color: #b9cee9;
    font-size: 16px;
  }
  a.active,
  a:hover {
    background-color: #2b2f3a;
    color: #fff;
  }
`;
