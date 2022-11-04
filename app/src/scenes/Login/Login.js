import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Alert, Keyboard, Linking, StatusBar, TouchableWithoutFeedback, View } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMMKVNumber, useMMKVString } from 'react-native-mmkv';
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
import { DEVMODE_ENCRYPTION_KEY, DEVMODE_PASSWORD, MANO_DOWNLOAD_URL, VERSION } from '../../config';
import { useSetRecoilState } from 'recoil';
import { currentTeamState, organisationState, teamsState, usersState, userState } from '../../recoil/auth';
import { clearCache } from '../../services/dataManagement';
import { refreshTriggerState } from '../../components/Loader';
import { useIsFocused } from '@react-navigation/native';

const Login = ({ navigation }) => {
  const [authViaCookie, setAuthViaCookie] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [example, setExample] = useState('example@example.com');
  const [password, setPassword] = useState(__DEV__ ? DEVMODE_PASSWORD : '');
  const [encryptionKey, setEncryptionKey] = useState(__DEV__ ? DEVMODE_ENCRYPTION_KEY : '');
  const [showPassword, setShowPassword] = useState(false);
  const [showEncryptionKeyInput, setShowEncryptionKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useSetRecoilState(userState);
  // eslint-disable-next-line no-unused-vars
  const [_, setLastRefresh] = useMMKVNumber('mano-last-refresh-2022-11-04');
  const setOrganisation = useSetRecoilState(organisationState);
  const setTeams = useSetRecoilState(teamsState);
  const setUsers = useSetRecoilState(usersState);
  const setCurrentTeam = useSetRecoilState(currentTeamState);
  const [storageOrganisationId, setStorageOrganisationId] = useMMKVString('organisationId');
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    const initTimeout = setTimeout(async () => {
      // check version
      const response = await API.get({ path: '/version' });
      if (response.ok && VERSION !== response.data) {
        RNBootSplash.hide({ fade: true });
        Alert.alert(
          `La nouvelle version ${response.data} de Mano est disponible !`,
          `Vous avez la version ${VERSION} actuellement sur votre téléphone`,
          [
            { text: 'Télécharger', onPress: () => Linking.openURL(MANO_DOWNLOAD_URL) },
            { text: 'Plus tard', style: 'cancel' },
          ],
          { cancelable: true }
        );
        return;
      }
      // check token
      const storedToken = await AsyncStorage.getItem('persistent_token');
      if (!storedToken) return RNBootSplash.hide({ duration: 250 });
      API.token = storedToken;
      const { token, ok, user } = await API.get({
        path: '/user/signin-token',
        skipEncryption: '/user/signin-token',
      });
      if (ok && token && user) {
        setAuthViaCookie(true);
        API.onLogIn();
        const { organisation } = user;
        if (organisation._id !== storageOrganisationId) {
          clearCache();
          setLastRefresh(0);
        }
        setStorageOrganisationId(organisation._id);
        setOrganisation(organisation);
        setUserName(user.name);
        if (!!organisation.encryptionEnabled && !['superadmin'].includes(user.role)) setShowEncryptionKeyInput(true);
      } else {
        await AsyncStorage.removeItem('persistent_token');
      }
      RNBootSplash.hide({ duration: 250 });
      return setLoading(false);
    }, 500);

    return () => clearTimeout(initTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const toggleShowPassword = () => setShowPassword((show) => !show);

  const onEmailChange = ({ email, isValid, example }) => {
    setEmail(email);
    setIsValid(isValid);
    setExample(example);
  };

  const onResetCurrentUser = async () => {
    await AsyncStorage.removeItem('persistent_email');
    await AsyncStorage.removeItem('persistent_token');
    setEmail('');
    setPassword('');
    setAuthViaCookie(false);
    setUserName('');
    setShowEncryptionKeyInput(false);
    API.token = null;
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
      : await API.post({ path: '/user/signin', body: { password, email, ...userDebugInfos }, skipEncryption: true });
    if (response.error) {
      Alert.alert(response.error, null, [{ text: 'OK', onPress: () => passwordRef.current.focus() }], {
        cancelable: true,
        onDismiss: () => passwordRef.current.focus(),
      });
      setLoading(false);
      setPassword('');
      return;
    }
    if (response?.user?.role === 'superadmin') {
      Alert.alert("Vous n'avez pas d'organisation dans Mano");
      setLoading(false);
      return;
    }
    if (response.ok) {
      Keyboard.dismiss();
      API.token = response.token;
      API.onLogIn();
      await AsyncStorage.setItem('persistent_token', response.token);
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
        scrollViewRef.current,
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
            <Title heavy>{userName ? `Bienvenue ${userName}\u00A0 !` : 'Bienvenue !'}</Title>
            <SubTitle>
              Veuillez saisir {authViaCookie ? 'la clé de chiffrement définie par' : 'un e-mail enregistré auprès de'} votre administrateur
            </SubTitle>
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
            {authViaCookie ? (
              <TouchableWithoutFeedback onPress={onResetCurrentUser}>
                <Hint>Se connecter avec un autre utilisateur</Hint>
              </TouchableWithoutFeedback>
            ) : (
              <TouchableWithoutFeedback onPress={onForgetPassword}>
                <Hint>J'ai oublié mon mot de passe</Hint>
              </TouchableWithoutFeedback>
            )}
            <ButtonsContainer>
              <Button caption="Connecter" onPress={onConnect} loading={loading} disabled={loading} testID="button-connect" />
            </ButtonsContainer>
            <Version>Mano v{VERSION}</Version>
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
