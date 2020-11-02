import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import styled from "styled-components";

import { setUser } from "../../redux/auth/actions";
import api from "../../services/api";

export default () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  async function logout() {
    await api.post(`/admin/logout`);
    dispatch(setUser(null));
  }
  return (
    <div className="User">
      <Dropdown>
        <Aavatar onClick={() => setOpen(!open)} src={require("../../assets/avatar.jpg")} />
        <Menu open={open}>
          <Close onClick={() => setOpen(false)}>&times;</Close>
          <Item onClick={() => setOpen(false)}>
            <Link to="/account">Account</Link>
          </Item>
          <Item onClick={logout}>
            <Link to="#">Logout</Link>
          </Item>
        </Menu>
      </Dropdown>
    </div>
  );
};

const Dropdown = styled.div`
  position: relative;
  :hover > div {
    opacity: 1;
    visibility: visible;
  }
`;

const Menu = styled.div`
  min-width: 150px;
  border-radius: 2px;
  background-color: #fff;
  opacity: ${({ open }) => (open ? 1 : 0)};
  visibility: ${({ open }) => (open ? "visible" : "hidden")};
  -webkit-transition: all 0.3s;
  transition: all 0.3s;
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 100;
  box-shadow: 0 0 18px 0 rgba(0, 0, 0, 0.12);
  @media (max-width: 767px) {
    position: fixed;
    top: 0;
    left: 0;
    transform: translateX(${({ open }) => (open ? 0 : "105%")});
    opacity: 1;
    visibility: visible;
    height: 100vh;
    width: 100vw;
    background-color: #fff;
    z-index: 11;
  }
`;

const Aavatar = styled.img`
  width: 36px !important;
  height: 36px !important;
  background-color: #aaa;
  border-radius: 50%;
  cursor: pointer;
`;

const Item = styled.div`
  font: 13px Arial;
  border-left: solid transparent 4px;
  border-radius: 0;
  text-align: left;
  color: #888888;
  cursor: pointer;
  &:hover {
    border-left: solid #4d90fb 4px;
    background-color: #d3bfc731;
    color: #333;
  }
  a {
    color: inherit;
    text-decoration: none;
    display: block;
    padding: 10px;
  }
`;
const Close = styled.div`
  font-size: 30px;
  color: #666;
  padding: 0 15px 20px;
  display: none;
  @media (max-width: 767px) {
    display: block;
  }
`;
