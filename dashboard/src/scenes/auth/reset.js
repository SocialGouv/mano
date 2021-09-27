import React, { useState } from 'react';
import queryString from 'query-string';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { toastr } from 'react-redux-toastr';

import API from '../../services/api';
import ChangePassword from '../../components/ChangePassword';

const Reset = ({ location }) => {
  const [redirect, setRedirect] = useState(false);

  const { token } = queryString.parse(location.search);

  if (!token) return <Redirect to="/" />;
  if (redirect) return <Redirect to="/" />;

  return (
    <AuthWrapper>
      <Title>Modifiez votre mot de passe</Title>
      <ChangePassword
        onSubmit={({ newPassword }) => {
          API.toastr = toastr;
          API.post({
            path: '/user/forgot_password_reset',
            skipEncryption: '/user/forgot_password_reset',
            body: {
              token,
              password: newPassword,
            },
          });
        }}
        onFinished={() => setRedirect(true)}
        withCurrentPassword={false}
      />
    </AuthWrapper>
  );
};

const AuthWrapper = styled.div`
  max-width: 500px;
  width: calc(100% - 40px);
  padding: 40px 30px 30px;
  border-radius: 0.5em;
  background-color: #fff;
  font-family: Nista, Helvetica;
  color: #252b2f;
  margin: 5em auto;
  overflow: hidden;
  -webkit-box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
`;

const Title = styled.div`
  font-family: Helvetica;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 50px;
`;

export default Reset;
