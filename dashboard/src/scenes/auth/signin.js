import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FormGroup } from 'reactstrap';
import validator from 'validator';
import { Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { detect } from 'detect-browser';
import ButtonCustom from '../../components/ButtonCustom';
import { DEFAULT_ORGANISATION_KEY } from '../../config';
import PasswordInput from '../../components/PasswordInput';
import { currentTeamState, organisationState, sessionInitialDateTimestamp, teamsState, usersState, userState } from '../../recoil/auth';
import API, { setOrgEncryptionKey, authTokenState } from '../../services/api';
import { useDataLoader } from '../../components/DataLoader';
import useMinimumWidth from '../../services/useMinimumWidth';
import LoadingButton from '../../components/loadingButton';

const SignIn = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const setSessionInitialTimestamp = useSetRecoilState(sessionInitialDateTimestamp);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const setTeams = useSetRecoilState(teamsState);
  const setUsers = useSetRecoilState(usersState);
  const [user, setUser] = useRecoilState(userState);
  const history = useHistory();
  const [showErrors, setShowErrors] = useState(false);
  // const [userName, setUserName] = useState(false);
  const [showSelectTeam, setShowSelectTeam] = useState(false);
  const [showEncryption, setShowEncryption] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authViaCookie, setAuthViaCookie] = useState(false);
  const { load: runDataLoader, isLoading, resetCache } = useDataLoader();
  const setToken = useSetRecoilState(authTokenState);

  const [signinForm, setSigninForm] = useState({ email: '', password: '', orgEncryptionKey: DEFAULT_ORGANISATION_KEY || '' });
  const [signinFormErrors, setSigninFormErrors] = useState({ email: '', password: '', orgEncryptionKey: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMinimumWidth('sm');

  useEffect(() => {
    if (isLoading !== true) return;
    if (isDesktop && !!organisation?.receptionEnabled) {
      history.push('/reception');
    } else {
      history.push('/action');
    }
  }, [history, organisation, isLoading, isDesktop]);

  const onSigninValidated = async () => runDataLoader();

  const onLogout = async () => {
    await API.logout();
    setShowErrors(false);
    // setUserName('');
    setShowSelectTeam(false);
    setShowEncryption(false);
    setShowPassword(false);
    setAuthViaCookie(false);
  };

  useEffect(() => {
    (async () => {
      const { token, ok, user } = await API.get({ path: '/user/signin-token' });
      if (ok && token && user) {
        setAuthViaCookie(true);
        const { organisation } = user;
        if (organisation._id !== window.localStorage.getItem('mano-organisationId')) {
          await resetCache();
        }
        window.localStorage.setItem('mano-organisationId', organisation._id);
        setOrganisation(organisation);
        // setUserName(user.name);
        if (!!organisation.encryptionEnabled && !['superadmin'].includes(user.role)) setShowEncryption(true);
      }

      return setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    try {
      console.log('SLASH');
      e.preventDefault();
      const emailError = !authViaCookie && !validator.isEmail(signinForm.email) ? 'Adresse email invalide' : '';
      const passwordError = !authViaCookie && validator.isEmpty(signinForm.password) ? 'Ce champ est obligatoire' : '';
      const orgEncryptionKeyError = !!showEncryption && validator.isEmpty(signinForm.orgEncryptionKey) ? 'Ce champ est obligatoire' : '';
      if (emailError || passwordError || orgEncryptionKeyError) {
        setShowErrors(true);
        setSigninFormErrors({ email: emailError, password: passwordError, orgEncryptionKey: orgEncryptionKeyError });
        return;
      }
      setShowErrors(false);
      setIsSubmitting(true);
      const body = {
        email: signinForm.email,
        password: signinForm.password,
      };
      const browser = detect();
      if (browser) {
        body.browsertype = browser.type;
        body.browsername = browser.name;
        body.browserversion = browser.version;
        body.browseros = browser.os;
      }

      const { user, token, ok } = authViaCookie ? await API.get({ path: '/user/signin-token' }) : await API.post({ path: '/user/signin', body });
      if (!ok) return setIsSubmitting(false);
      const { organisation } = user;
      if (!!organisation.encryptionEnabled && !showEncryption && !['superadmin'].includes(user.role)) {
        setShowEncryption(true);
        return setIsSubmitting(false);
      }
      if (token) setToken(token);
      setSessionInitialTimestamp(Date.now());
      if (organisation._id !== window.localStorage.getItem('mano-organisationId')) {
        await resetCache();
      }
      window.localStorage.setItem('mano-organisationId', organisation._id);
      setOrganisation(organisation);
      if (!['superadmin'].includes(user.role) && !!signinForm.orgEncryptionKey) {
        const encryptionIsValid = await setOrgEncryptionKey(signinForm.orgEncryptionKey.trim(), organisation);
        if (!encryptionIsValid) return setIsSubmitting(false);
      }
      setUser(user);
      // now login !
      // superadmin
      if (['superadmin'].includes(user.role)) {
        setIsSubmitting(false);
        history.push('/organisation');
        return;
      }
      const teamResponse = await API.get({ path: '/team' });
      const teams = teamResponse.data;
      const usersResponse = await API.get({ path: '/user', query: { minimal: true } });
      const users = usersResponse.data;
      setTeams(teams);
      setUsers(users);
      // onboarding
      if (!organisation.encryptionEnabled && ['admin'].includes(user.role)) {
        history.push(`/organisation/${organisation._id}`);
        return;
      }
      if (!teams.length) {
        history.push('/team');
        return;
      }
      // basic login
      // if (user.teams.length === 1 || (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SKIP_TEAMS === 'true')) {
      setCurrentTeam(user.teams[0]);
      onSigninValidated();
      return;
      // }
      // setShowSelectTeam(true);
    } catch (signinError) {
      console.log('error signin', signinError);
      toast.error('Mauvais identifiants', signinError.message);
    }
  };
  const handleChangeRequest = (e) => {
    setShowErrors(false);
    setSigninForm((form) => ({ ...form, [e.target.name]: e.target.value }));
  };

  if (loading) return <></>;

  if (showSelectTeam) {
    return (
      <div className="tw-mx-10 tw-my-0 tw-w-full tw-max-w-lg tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-white tw-px-7 tw-py-10 tw-text-black tw-shadow-[0_0_20px_0_rgba(0,0,0,0.2)]">
        <h1 className="tw-mb-6 tw-text-center tw-text-3xl tw-font-bold">Choisir son équipe pour commencer</h1>
        <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-gap-7 [&_>_*]:!tw-w-full">
          {user.teams.map((team) => (
            <ButtonCustom
              key={team._id}
              title={team.name}
              onClick={() => {
                setCurrentTeam(team);
                onSigninValidated();
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper onSubmit={handleSubmit} method="POST">
      <Title>Se connecter</Title>
      {!authViaCookie && (
        <>
          <StyledFormGroup>
            <div>
              <InputField
                // validate={(v) => !validator.isEmail(v) && 'Adresse email invalide'}
                name="email"
                type="email"
                id="email"
                value={signinForm.email}
                onChange={handleChangeRequest}
              />
              <label htmlFor="email">Email </label>
            </div>
            {!!showErrors && <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{signinFormErrors.email}</p>}
          </StyledFormGroup>
          <div className="tw-mb-6">
            <div className="tw-flex tw-flex-col-reverse">
              <PasswordInput
                className="tw-mb-1.5 tw-block tw-w-full tw-rounded tw-border tw-border-main75 tw-bg-transparent tw-p-2.5 tw-text-black tw-outline-main tw-transition-all"
                name="password"
                id="password"
                placeholder="Cliquez ici pour entrer votre mot de passe"
                autoComplete="current-password"
                value={signinForm.password}
                onChange={handleChangeRequest}
                setShowPassword={setShowPassword}
                showPassword={showPassword}
              />
              <label htmlFor="password">Mot de passe</label>
            </div>
            {!!showErrors && <p className="tw-text-xs tw-text-red-500">{signinFormErrors.password}</p>}
          </div>
          <div className="tw-mb-5 -tw-mt-5 tw-text-right tw-text-xs">
            <Link to="/auth/forgot">Mot de passe oublié ?</Link>
          </div>
        </>
      )}
      {!!showEncryption && (
        <div className="tw-mb-6">
          <div className="tw-flex tw-flex-col-reverse">
            <PasswordInput
              className="tw-mb-1.5 tw-block tw-w-full tw-rounded tw-border tw-border-main75 tw-bg-transparent tw-p-2.5 tw-text-[8px] tw-leading-[18px] tw-tracking-[3.5px] tw-text-black tw-outline-main tw-transition-all [&.hide-password]:tw-font-['password']"
              name="orgEncryptionKey"
              type="search" // for the delete button
              autoComplete="off"
              id="orgEncryptionKey"
              autoFocus
              value={signinForm.orgEncryptionKey}
              onChange={handleChangeRequest}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            <label htmlFor="orgEncryptionKey">Clé de chiffrement d'organisation</label>
          </div>
          {!!showErrors && <p className="tw-text-xs tw-text-red-500">{signinFormErrors.orgEncryptionKey}</p>}
        </div>
      )}
      <Submit loading={isSubmitting} type="submit" color="primary" onClick={handleSubmit}>
        Se connecter
      </Submit>
      {!!authViaCookie && (
        <ButtonCustom
          color="link"
          title="Me connecter avec un autre utilisateur"
          onClick={onLogout}
          type="button"
          className="tw-m-auto tw-font-[Helvetica] !tw-text-base !tw-font-normal"
        />
      )}
      <p className="tw-mx-auto tw-mt-5 tw-mb-0 tw-block tw-text-center tw-text-xs">Version: 14 janvier 2021</p>
    </AuthWrapper>
  );
};

export default SignIn;

const AuthWrapper = styled.form`
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
  margin-bottom: 15px;
`;

const Submit = styled(LoadingButton)`
  font-family: Helvetica;
  width: 220px;
  border-radius: 30px;
  margin: auto;
  display: block;
  font-size: 16px;
  padding: 8px;
  min-height: 42px;
`;

const InputField = styled.input`
  background-color: transparent;
  outline: 0;
  display: block;
  width: 100%;
  padding: 0.625rem;
  margin-bottom: 0.375rem;
  border-radius: 4px;
  border: 1px solid #a7b0b7;
  color: #252b2f;
  -webkit-transition: border 0.2s ease;
  transition: border 0.2s ease;
  line-height: 1.2;
  &:focus {
    outline: none;
    border: 1px solid #116eee;
    & + label {
      color: #116eee;
    }
  }
`;
// const Account = styled.div`
//   text-align: center;
//   padding-top: 25px;
//   font-size: 14px;
// `;
const StyledFormGroup = styled(FormGroup)`
  margin-bottom: 25px;
  div {
    display: flex;
    flex-direction: column-reverse;
  }
`;
