import React from 'react';
import { useRecoilValue } from 'recoil';
import { usersState } from '../recoil/auth';
import SelectUser from './SelectUser';

const UserName = ({ id, wrapper = (name) => name, canAddUser, handleChange }) => {
  const users = useRecoilValue(usersState);

  const user = users.find((u) => u._id === id);

  if (!user?.name) {
    if (!canAddUser) return null;
  }
  return (
    <span style={{ textAlign: 'left' }}>
      {canAddUser ? (
        <>
          {wrapper()}
          <div style={{ minWidth: 250, fontSize: '1rem', fontWeight: 'normal' }}>
            <SelectUser inputId="user" key={id} value={id} onChange={(userId) => handleChange(userId)} />
          </div>
        </>
      ) : (
        wrapper(user.name)
      )}
    </span>
  );
};

export default UserName;
