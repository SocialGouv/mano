import React, { useContext } from 'react';
import styled from 'styled-components';
import AuthContext from '../contexts/auth';
import { MyText } from './MyText';

const UserName = ({ id, caption }) => {
  const { users } = useContext(AuthContext);

  const user = users.find((u) => u._id === id);

  if (!user?.name) return null;
  return (
    <FromUser>
      {caption} {user.name}
    </FromUser>
  );
};

export default UserName;

const FromUser = styled(MyText)`
  font-style: italic;
  margin-top: -10px;
  margin-bottom: 20px;
  margin-left: auto;
`;
