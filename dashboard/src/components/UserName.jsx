import React from "react";
import { useRecoilValue } from "recoil";
import { usersState } from "../recoil/auth";
import SelectUser from "./SelectUser";

const UserName = ({ id, wrapper = (name) => name, canAddUser = null, handleChange = null, className = "" }) => {
  const users = useRecoilValue(usersState);

  const user = users.find((u) => u._id === id);

  if (!user?.name) {
    if (!canAddUser) return null;
  }
  return (
    <span className={[className, "tw-text-left"].join(" ")}>
      {canAddUser ? (
        <>
          {wrapper()}
          <div className="tw-w-64 tw-min-w-max tw-text-base tw-font-normal">
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
