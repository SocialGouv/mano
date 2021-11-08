import React from 'react';
import useAuth from '../recoil/auth';

const UserName = ({ id, wrapper = (name) => name }) => {
  const { users } = useAuth();

  const user = users.find((u) => u._id === id);

  if (!user?.name) return null;
  return <span>{wrapper(user.name)}</span>;
};

export default UserName;
