import React from "react";
import styled from "styled-components";
import User from "./user";

export default ({ title }) => {
  return (
    <Header>
      <Title>{title}</Title>
      <User />
    </Header>
  );
};

const Header = styled.div`
  padding: 15px;
  background-color: #284fa2;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.div`
  color: #fff;
  font-size: 26px;
  font-weight: 800;
`;
