import React, { useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import packageInfo from '../../../package.json';
import ChangePassword from '../../components/ChangePassword';
import useApi from '../../services/api';

const Reset = () => {
  const [redirect, setRedirect] = useState(false);
  const API = useApi();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  if (!token) return <Redirect to="/" />;
  if (redirect) return <Redirect to="/" />;

  return (
    <div className="tw-mx-10 tw-my-20 tw-w-full tw-max-w-lg tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-white tw-px-7 tw-pt-10 tw-pb-2 tw-text-black tw-shadow-[0_0_20px_0_rgba(0,0,0,0.2)]">
      <h1 className="tw-mb-6 tw-text-center tw-text-3xl tw-font-bold">Modifiez votre mot de passe</h1>
      <ChangePassword
        onSubmit={({ newPassword }) => {
          return API.post({
            path: '/user/forgot_password_reset',
            body: {
              token,
              password: newPassword,
            },
          });
        }}
        onFinished={() => setRedirect(true)}
        withCurrentPassword={false}
        centerButton
      />
      <p className="tw-mx-auto tw-mt-5 tw-mb-0 tw-block tw-text-center tw-text-xs">Version: {packageInfo.version}</p>
    </div>
  );
};

export default Reset;
