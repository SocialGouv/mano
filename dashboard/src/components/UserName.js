import React from 'react';
import { useRecoilValue } from 'recoil';
import { usersState } from '../recoil/auth';

const UserName = ({ id, wrapper = (name) => name }) => {
  const users = useRecoilValue(usersState);

  const user = users.find((u) => u._id === id);

  if (!user?.name) return null;
  return <span>{wrapper(user.name)}</span>;
};

export default UserName;
