import React, { useContext } from "react";
import AuthContext from "../contexts/auth";

const UserName = ({ id, wrapper = (name) => name }) => {
  const { users } = useContext(AuthContext);

  const user = users.find((u) => u._id === id);

  if (!user?.name) return null;
  return <span>{wrapper(user.name)}</span>;
};

export default UserName;
