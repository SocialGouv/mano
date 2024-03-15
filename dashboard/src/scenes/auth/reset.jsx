import React, { useState } from "react";
import { Redirect, useLocation } from "react-router-dom";
import ChangePassword from "../../components/ChangePassword";
import API from "../../services/api";
import { useRecoilValue } from "recoil";
import { deploymentShortCommitSHAState } from "../../recoil/version";

const Reset = () => {
  const [redirect, setRedirect] = useState(false);
  const deploymentCommit = useRecoilValue(deploymentShortCommitSHAState);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");
  const newUser = searchParams.get("newUser") === "true";
  const [name, setName] = useState("");

  if (!token) return <Redirect to="/" />;
  if (redirect) return <Redirect to="/" />;

  return (
    <div className="tw-mx-10 tw-my-20 tw-w-full tw-max-w-lg tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-white tw-px-7 tw-pb-2 tw-pt-10 tw-text-black tw-shadow-[0_0_20px_0_rgba(0,0,0,0.2)]">
      <h1 className="tw-mb-6 tw-text-center tw-text-3xl tw-font-bold">
        {newUser ? "Choisissez un nom d'utilisateur et un mot de passe" : "Modifiez votre mot de passe"}
      </h1>
      {!!newUser && (
        <div className="tw-mb-4 tw-flex tw-flex-col tw-py-2">
          <label htmlFor="email">Nom d'utilisateur</label>
          <input className="tailwindui" name="name" id="name" type="search" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
      <ChangePassword
        onSubmit={({ newPassword }) => {
          API.logout(false);
          return API.post({
            path: "/user/forgot_password_reset",
            body: {
              token,
              name,
              password: newPassword,
            },
          });
        }}
        onFinished={() => setRedirect(true)}
        withCurrentPassword={false}
        centerButton
      />
      <p className="tw-mx-auto tw-mb-0 tw-mt-5 tw-block tw-text-center tw-text-xs tw-text-gray-500">Version&nbsp;: {deploymentCommit}</p>
    </div>
  );
};

export default Reset;
