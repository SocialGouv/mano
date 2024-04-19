import React from 'react';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components/native';
import { usersState } from '../recoil/auth';
import { MyText } from './MyText';

const UserName = ({ id, caption }) => {
  const users = useRecoilValue(usersState);

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
