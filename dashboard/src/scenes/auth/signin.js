import React, { useState, useEffect } from 'react';
import { FormGroup } from 'reactstrap';
import { Formik, Field } from 'formik';
import validator from 'validator';
import { Link, useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { detect } from 'detect-browser';
import { version } from '../../../package.json';
import ButtonCustom from '../../components/ButtonCustom';
import { DEFAULT_ORGANISATION_KEY, theme } from '../../config';
import PasswordInput from '../../components/PasswordInput';
import { currentTeamState, organisationState, teamsState, usersState, userState } from '../../recoil/auth';
import useApi, { setOrgEncryptionKey } from '../../services/api';
import { AppSentry } from '../../services/sentry';
import { refreshTriggerState, loadingState, lastRefreshState } from '../../components/Loader';
import { clearCache } from '../../services/dataManagement';

const SignIn = () => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [refreshTrigger, setRefreshTrigger] = useRecoilState(refreshTriggerState);
  const setGlobalLoading = useSetRecoilState(loadingState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const setLastRefresh = useSetRecoilState(lastRefreshState);
  const setTeams = useSetRecoilState(teamsState);
  const setUsers = useSetRecoilState(usersState);
  const [user, setUser] = useRecoilState(userState);
  const history = useHistory();
  const [showErrors, setShowErrors] = useState(false);
  const [userName, setUserName] = useState(false);
  const [showSelectTeam, setShowSelectTeam] = useState(false);
  const [showEncryption, setShowEncryption] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authViaCookie, setAuthViaCookie] = useState(false);
  const API = useApi();

  useEffect(() => {
    if (refreshTrigger.status !== true) return;
    if (!!organisation?.receptionEnabled) {
      history.push('/reception');
    } else {
      history.push('/action');
    }
  }, [history, organisation, refreshTrigger]);

  const onSigninValidated = async () => {
    setRefreshTrigger({
      status: true,
      options: { initialLoad: true, showFullScreen: true },
    });
    setGlobalLoading('Initialisation...');
  };

  const onLogout = async () => {
    await API.logout();
    setShowErrors(false);
    setUserName('');
    setShowSelectTeam(false);
    setShowEncryption(false);
    setShowPassword(false);
    setAuthViaCookie(false);
  };

  useEffect(() => {
    (async () => {
      const { token, ok, user } = await API.get({
        path: '/user/signin-token',
        skipEncryption: '/user/signin-token',
      });
      if (ok && token && user) {
        setAuthViaCookie(true);
        const { organisation } = user;
        if (organisation._id !== window.localStorage.getItem('mano-organisationId')) {
          clearCache();
          setLastRefresh(0);
        }
        window.localStorage.setItem('mano-organisationId', organisation._id);
        setOrganisation(organisation);
        setUserName(user.name);
        if (!!organisation.encryptionEnabled && !['superadmin'].includes(user.role)) setShowEncryption(true);
      }

      return setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <></>;

  if (showSelectTeam) {
    return (
      <AuthWrapper>
        <Title>Choisir son équipe pour commencer</Title>
        <TeamsContainer>
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
        </TeamsContainer>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <Title>{userName ? `Bienvenue ${userName?.split(' ')?.[0]} !` : 'Bienvenue !'}</Title>
      <Formik
        initialValues={{ email: '', password: '', orgEncryptionKey: DEFAULT_ORGANISATION_KEY || '' }}
        onSubmit={async (values, actions) => {
          try {
            const body = {
              email: values.email,
              password: values.password,
            };
            const browser = detect();
            if (browser) {
              body.browsertype = browser.type;
              body.browsername = browser.name;
              body.browserversion = browser.version;
              body.browseros = browser.os;
            }

            const { user, token, ok } = authViaCookie
              ? await API.get({
                  path: '/user/signin-token',
                  skipEncryption: '/user/signin-token',
                })
              : await API.post({
                  path: '/user/signin',
                  skipEncryption: '/user/signin',
                  body,
                });
            if (!ok) return actions.setSubmitting(false);
            const { organisation } = user;
            if (!!organisation.encryptionEnabled && !showEncryption && !['superadmin'].includes(user.role)) {
              setShowEncryption(true);
              return actions.setSubmitting(false);
            }
            if (token) API.setToken(token);
            if (organisation._id !== window.localStorage.getItem('mano-organisationId')) {
              clearCache();
              setLastRefresh(0);
            }
            window.localStorage.setItem('mano-organisationId', organisation._id);
            setOrganisation(organisation);
            if (!!values.orgEncryptionKey) {
              const encryptionIsValid = await setOrgEncryptionKey(values.orgEncryptionKey.trim(), organisation);
              if (!encryptionIsValid) return;
            }
            setUser(user);
            AppSentry.setUser(user);
            // now login !
            // superadmin
            if (['superadmin'].includes(user.role)) {
              actions.setSubmitting(false);
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
            if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SKIP_TEAMS === 'true') {
              setCurrentTeam(teams[0]);
              onSigninValidated();
              return;
            }
            if (user.teams.length === 1) {
              setCurrentTeam(user.teams[0]);
              onSigninValidated();
              return;
            }
            setShowSelectTeam(true);
          } catch (signinError) {
            console.log('error signin', signinError);
            toastr.error('Mauvais identifiants', signinError.message);
          }
        }}>
        {({ values, errors, isSubmitting, handleChange, handleSubmit }) => {
          const handleChangeRequest = (args) => {
            setShowErrors(false);
            handleChange(args);
          };

          const handleSubmitRequest = (args) => {
            setShowErrors(true);
            handleSubmit(args);
          };

          return (
            <form onSubmit={handleSubmitRequest}>
              {!authViaCookie && (
                <>
                  <StyledFormGroup>
                    <div>
                      <InputField
                        validate={(v) => !validator.isEmail(v) && 'Adresse email invalide'}
                        name="email"
                        type="email"
                        id="email"
                        autoComplete="email"
                        value={values.email}
                        onChange={handleChangeRequest}
                      />
                      <label htmlFor="email">Email </label>
                    </div>
                    {!!showErrors && <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{errors.email}</p>}
                  </StyledFormGroup>
                  <StyledFormGroup>
                    <div>
                      <PasswordInput
                        InputComponent={InputField}
                        validate={(v) => validator.isEmpty(v) && 'Ce champ est obligatoire'}
                        name="password"
                        id="password"
                        autoComplete="current-password"
                        value={values.password}
                        onChange={handleChangeRequest}
                        setShowPassword={setShowPassword}
                        showPassword={showPassword}
                      />
                      <label htmlFor="password">Mot de passe</label>
                    </div>
                    {!!showErrors && <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{errors.password}</p>}
                  </StyledFormGroup>
                  <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -20, fontSize: 12 }}>
                    <Link to="/auth/forgot">Mot de passe oublié ?</Link>
                  </div>
                </>
              )}
              {!!showEncryption && (
                <StyledFormGroup>
                  <div>
                    <PasswordInput
                      InputComponent={InputField}
                      validate={(v) => validator.isEmpty(v) && 'Ce champ est obligatoire'}
                      name="orgEncryptionKey"
                      type="search" // for the delete button
                      autoComplete="off"
                      id="orgEncryptionKey"
                      autoFocus
                      value={values.orgEncryptionKey}
                      onChange={handleChangeRequest}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />
                    <label htmlFor="orgEncryptionKey">Clé de chiffrement d'organisation</label>
                  </div>
                  {!!showErrors && <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{errors.password}</p>}
                </StyledFormGroup>
              )}
              <Submit loading={isSubmitting} type="submit" color="primary" title="Se connecter" />
              {!!authViaCookie && <ChangeUserButton color="link" title="Me connecter avec un autre utilisateur" onClick={onLogout} type="button" />}
              <p
                style={{
                  fontSize: 12,
                  margin: '20px auto 0',
                  display: 'block',
                  textAlign: 'center',
                }}>
                Version: {version}
              </p>
            </form>
          );
        }}
      </Formik>
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

const Submit = styled(ButtonCustom)`
  font-family: Helvetica;
  width: 220px;
  border-radius: 30px;
  margin: auto;
  font-size: 16px;
  min-height: 42px;
`;

const ChangeUserButton = styled(ButtonCustom)`
  font-family: Helvetica;
  margin: auto;
  margin-top: 15px;
  font-weight: normal;
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

const StyledFormGroup = styled(FormGroup)`
  margin-bottom: 25px;
  > div {
    display: flex;
    flex-direction: column-reverse;
  }
`;

const TeamsContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  > * {
    width: 100%;
    margin-top: 30px;
  }
`;

export default SignIn;
