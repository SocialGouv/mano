import React, { useState } from 'react';
import {  Field, Formik } from 'formik';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
// import { useRecoilState, useSetRecoilState } from 'recoil';
// import { currentTeamState, organisationState, teamsState, usersState, userState } from '../../recoil/auth';
import styled from 'styled-components';
import useApi, { setOrgEncryptionKey, hashedOrgEncryptionKey } from '../../services/api';
import { Link, useHistory } from 'react-router-dom';
import { theme } from '../../config';
import { refreshTriggerState } from '../../components/Loader';
import { encryptVerificationKey } from '../../services/encryption';
import ButtonCustom from '../../components/ButtonCustom';
import PasswordInput from '../../components/PasswordInput';

const Oidc = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const [password, setPassword] = useState('');
  const history = useHistory();
  const [user, setUser] = useRecoilState(userState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const [userName, setUserName] = useState('');
  const API = useApi();
  const [showPassword, setShowPassword] = useState(false);
  const setEncryptionVerificationKey = async (organisation, user) => {
    if (!organisation.encryptionEnabled) return;
    if (!organisation.encryptedVerificationKey) {
      const encryptedVerificationKey = await encryptVerificationKey(hashedOrgEncryptionKey);
      const orgRes = await API.put({ path: `/organisation/${organisation._id}`, body: { encryptedVerificationKey } });
      if (orgRes.ok) setOrganisation(orgRes.data);
    }
  };


  const onChangeUsername = (event) => {
    setUserName(event.target.value)
  }
  const onChangePassword = (event) => {
    setPassword(event.target.value)
  }
  const handleSubmit = (event) =>
  {
      API.post({ path: '/ldap', 
      body: {username: userName, password: password}
       }).then(response => {
      console.log(response);
      setCurrentTeam(response.user.teams[0]);
      onSigninValidated(organisation, user);
      return;
    })
    //console.log(response);
    event.preventDefault();
  }

  const onSigninValidated = async (organisation, user) => {
    setRefreshTrigger({
      status: true,
      method: 'refresh',
      options: [{ initialLoad: true, showFullScreen: true }, () => setEncryptionVerificationKey(organisation, user)],
    });
    if (!!organisation?.receptionEnabled) {
      history.push('/reception');
    } else {
      history.push('/');
    }
  };
  {
    return (
      <AuthWrapper>
         <Title>{userName ? `Bienvenue ${userName?.split(' ')?.[0]} !` : 'Bienvenue !'}</Title>
         <Formik>
      <form onSubmit={handleSubmit}>
        <label>Username:
          <InputField type="text" value={userName} onChange={onChangeUsername}/>
        </label>
        <label>Password:
          <PasswordInput setShowPassword={setShowPassword} showPassword={showPassword} InputComponent={InputField}  value={password} onChange={onChangePassword}/>
        </label>
        <Submit type="submit" color="primary" title="Envoyer" />
      </form>
      </Formik>
      <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -20, fontSize: 12 }}>
      <Link to="/auth">Connexion LDAP</Link><br></br>
      </div>
      </AuthWrapper>
    )
  }
}



const AuthWrapper = styled.div`
  max-width: 500px;
  width: calc(100% - 40px);
  padding: 40px 30px 30px;
  border-radius: 0.5em;
  background-color: #fff;
  font-family: Nista, Helvetica;
  color: #252b2f;
  margin: 5em auto;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 1.25rem 0 rgba(0, 0, 0, 0.2);
`;

const Title = styled.div`
  font-family: Helvetica;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 15px;
`;


const InputField = styled(Field)`
  background-color: transparent;
  outline: 0;
  display: block;
  width: 100%;
  padding: 0.625rem;
  margin-bottom: 0.375rem;
  border-radius: 4px;
  border: 1px solid #49c3a6;
  color: #252b2f;
  -webkit-transition: border 0.2s ease;
  transition: border 0.2s ease;
  line-height: 1.2em;
  &:focus {
    outline: none;
    border: 1px solid ${theme.main}EE;
    & + label {
      color: ${theme.main}CC;
    }
  }

  &#orgEncryptionKey.hide-password {
    font-family: password;
    font-size: 9px;
    line-height: 18px;
    letter-spacing: 1.2px;
  }
`;

const Submit = styled(ButtonCustom)`
  font-family: Helvetica;
  width: 220px;
  border-radius: 30px;
  margin: auto;
  font-size: 16px;
  min-height: 42px;
`;
export default Oidc;