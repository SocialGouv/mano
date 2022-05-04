import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Alert, findNodeHandle, Keyboard, Linking, StatusBar, TouchableWithoutFeedback, View, Text } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-community/async-storage';
import { version } from '../../../package.json';
import API from '../../services/api';
import SceneContainer from '../../components/SceneContainer';
import ScrollContainer from '../../components/ScrollContainer';
import colors from '../../utils/colors';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import EmailInput from '../../services/EmailInput';
import { MyText } from '../../components/MyText';
import InputLabelled from '../../components/InputLabelled';
import EyeIcon from '../../icons/EyeIcon';
import Title, { SubTitle } from '../../components/Title';
import { MANO_DOWNLOAD_URL } from '../../config';
import { useSetRecoilState } from 'recoil';
import { currentTeamState, organisationState, teamsState, usersState, userState } from '../../recoil/auth';
import { clearCache, useStorage } from '../../services/dataManagement';
import { refreshTriggerState } from '../../components/Loader';

const Login = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [example, setExample] = useState('example@example.com');
  const [password, setPassword] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEncryptionKeyInput, setShowEncryptionKeyInput] = useState(false);
  const [authViaCookie, setAuthViaCookie] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useSetRecoilState(userState);
  const setLastRefresh = useStorage('last-refresh--cache-version-2022-04-26', 0)[1];
  const setOrganisation = useSetRecoilState(organisationState);
  const setTeams = useSetRecoilState(teamsState);
  const setUsers = useSetRecoilState(usersState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const [storageOrganisationId, setStorageOrganisationId] = useStorage('organisationId', 0);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);

  const checkVersion = () =>
    new Promise((res) => async () => {
      console.log('pipi');
      const response = await API.get({ path: '/version' });
      console.log('popopo');
      if (!response.ok || version === response.data) {
        res(true);
        return;
      }
      res(false);
      if (version !== response.data) {
        Alert.alert(
          `La nouvelle version ${response.data} de Mano est disponible !`,
          `Vous avez la version ${version} actuellement sur votre téléphone`,
          [
            { text: 'Télécharger', onPress: () => Linking.openURL(MANO_DOWNLOAD_URL) },
            { text: 'Plus tard', style: 'cancel' },
          ],
          { cancelable: true }
        );
      }
    });

  useEffect(() => {
    setTimeout(async () => {
      RNBootSplash.hide({ duration: 250 });
      console.log('yololo');
      const response = await API.get({ path: '/version' });
      if (response.ok && version !== response.data) {
        Alert.alert(
          `La nouvelle version ${response.data} de Mano est disponible !`,
          `Vous avez la version ${version} actuellement sur votre téléphone`,
          [
            { text: 'Télécharger', onPress: () => Linking.openURL(MANO_DOWNLOAD_URL) },
            { text: 'Plus tard', style: 'cancel' },
          ],
          { cancelable: true }
        );
        return;
      }
      console.log('yalalal');
      const { token, ok, user } = await API.get({
        path: '/user/signin-token',
        skipEncryption: '/user/signin-token',
      });
      console.log({ token, ok, user });
      if (ok && token && user) {
        setAuthViaCookie(true);
        const { organisation } = user;
        if (organisation._id !== storageOrganisationId) {
          clearCache();
          setLastRefresh(0);
        }
        setOrganisation(organisation);
        setUserName(user.name);
        if (!!organisation.encryptionEnabled && !['superadmin'].includes(user.role)) setShowEncryptionKeyInput(true);
      }

      return setLoading(false);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleShowPassword = () => setShowPassword((show) => !show);

  const onEmailChange = ({ email, isValid, example }) => {
    setEmail(email);
    setIsValid(isValid);
    setExample(example);
  };

  const onForgetPassword = () => navigation.navigate('ForgetPassword');
  const onConnect = async () => {
    if (!authViaCookie) {
      if (!isValid) {
        Alert.alert("L'email n'est pas valide.", `Il doit être de la forme ${example}`);
        emailRef.current.focus();
        return;
      }
      if (password === '') {
        Alert.alert('Mot de passe incorrect', 'Le mot de passe ne peut pas être vide');
        passwordRef.current.focus();
        return;
      }
    }
    setLoading(true);
    const userDebugInfos = await API.getUserDebugInfos();
    const response = authViaCookie
      ? await API.get({
          path: '/user/signin-token',
          skipEncryption: '/user/signin-token',
        })
      : await API.post({
          path: '/user/signin',
          skipEncryption: '/user/signin',
          body: { password, email, ...userDebugInfos },
        });
    if (response.error) {
      Alert.alert(response.error, null, [{ text: 'OK', onPress: () => passwordRef.current.focus() }], {
        cancelable: true,
        onDismiss: () => passwordRef.current.focus(),
      });
      setLoading(false);
      setPassword('');
      return;
    }
    if (response.user.role === 'superadmin') {
      Alert.alert("Vous n'avez pas d'organisation dans Mano");
      setLoading(false);
      return;
    }
    if (response.ok) {
      Keyboard.dismiss();
      API.token = response.token;
      API.showTokenExpiredError = true;
      API.organisation = response.user.organisation;
      setUser(response.user);
      setOrganisation(response.user.organisation);
      if (!!response.user.organisation?.encryptionEnabled && !showEncryptionKeyInput) {
        setLoading(false);
        setShowEncryptionKeyInput(true);
        return;
      }
      if (showEncryptionKeyInput) {
        const keyIsValid = await API.setOrgEncryptionKey(encryptionKey);
        if (!keyIsValid) {
          setLoading(false);
          return;
        }
      }
      await AsyncStorage.setItem('persistent_email', email);
      const { data: teams } = await API.get({ path: '/team' });
      const { data: users } = await API.get({ path: '/user', query: { minimal: true } });
      setUser(response.user);
      setOrganisation(response.user.organisation);
      // We need to reset cache if organisation has changed.
      if (response.user.organisation._id !== storageOrganisationId) {
        clearCache();
        setLastRefresh(0);
      }
      setStorageOrganisationId(response.user.organisation._id);
      setUsers(users);
      setTeams(teams);
      API.navigation = navigation;
      // getting teams before going to team selection
      if (!__DEV__ && !response.user.lastChangePasswordAt) {
        navigation.navigate('ForceChangePassword');
      } else {
        if (!response.user?.termsAccepted) {
          navigation.navigate('CharteAcceptance');
        } else if (response.user?.teams?.length === 1) {
          setCurrentTeam(response.user.teams[0]);
          setRefreshTrigger({ status: true, options: { showFullScreen: true, initialLoad: true } });
          navigation.navigate('Home');
        } else {
          navigation.navigate('TeamSelection');
        }
      }
    }
    setTimeout(() => {
      // reset state
      setEmail('');
      setIsValid(false);
      setExample('example@example.com');
      setPassword('');
      setEncryptionKey('');
      setShowPassword(false);
      setShowEncryptionKeyInput(false);
      setLoading(false);
    }, 500);
  };

  const scrollViewRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const encryptionKeyRef = useRef(null);
  const _scrollToInput = (ref) => {
    if (!ref.current) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.current.measureLayout(
        findNodeHandle(scrollViewRef.current),
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  return (
    <Background>
      <SceneContainer>
        <ScrollContainer ref={scrollViewRef} keyboardShouldPersistTaps="handled" testID="login-screen">
          <View>
            <StatusBar backgroundColor={colors.app.color} />
            <Title heavy>{userName ? `Bienvenue ${userName}&nbsp;!` : 'Bienvenue !'}</Title>
            <SubTitle>Veuillez saisir un e-mail enregistré auprès de votre administrateur</SubTitle>
            {!authViaCookie && (
              <EmailInput
                onChange={onEmailChange}
                ref={emailRef}
                onFocus={() => _scrollToInput(emailRef)}
                onSubmitEditing={() => passwordRef.current.focus()}
                testID="login-email"
              />
            )}
            {!authViaCookie && (
              <InputLabelled
                ref={passwordRef}
                onChangeText={setPassword}
                label="Mot de passe"
                placeholder="unSecret23!"
                onFocus={() => _scrollToInput(passwordRef)}
                value={password}
                autoCompleteType="password"
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={onConnect}
                EndIcon={() => <EyeIcon strikedThrough={showPassword} />}
                onEndIconPress={toggleShowPassword}
                testID="login-password"
              />
            )}
            {!!showEncryptionKeyInput && (
              <InputLabelled
                ref={encryptionKeyRef}
                onChangeText={setEncryptionKey}
                label="Clé de chiffrement"
                placeholder="unSecret23!"
                onFocus={() => _scrollToInput(encryptionKeyRef)}
                value={encryptionKey}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={onConnect}
                EndIcon={() => <EyeIcon strikedThrough={showPassword} />}
                onEndIconPress={toggleShowPassword}
                testID="login-encryption"
              />
            )}
            <TouchableWithoutFeedback onPress={onForgetPassword}>
              <Hint>J'ai oublié mon mot de passe</Hint>
            </TouchableWithoutFeedback>
            <ButtonsContainer>
              <Button caption="Connecter" onPress={onConnect} loading={loading} disabled={loading} testID="button-connect" />
            </ButtonsContainer>
            <Version>Mano v{version}</Version>
          </View>
        </ScrollContainer>
      </SceneContainer>
    </Background>
  );
};

const Background = styled.View`
  flex: 1;
  background-color: #fff;
`;

const Hint = styled(MyText)`
  font-size: 13px;
  margin-top: 5%;
  margin-bottom: 10%;
  align-self: center;
  text-align: center;
  color: ${colors.app.color};
`;

const Version = styled(MyText)`
  font-size: 10px;
  margin-top: 10%;
  margin-bottom: 2%;
  align-self: center;
  text-align: center;
  /* color: #ddd; */
`;

export default Login;
