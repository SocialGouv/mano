import React from 'react';
import styled from 'styled-components';
import { Alert, findNodeHandle, Keyboard, Linking, StatusBar, TouchableWithoutFeedback, View } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-community/async-storage';
import { compose } from 'recompose';
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
import AuthContext from '../../contexts/auth';
import withContext from '../../contexts/withContext';
import RefreshContext from '../../contexts/refresh';
import { MANO_DOWNLOAD_URL } from '../../config';

const initState = {
  email: '',
  loading: false,
  example: 'example@example.com',
  password: '',
  encryptionKey: '',
  showPassword: false,
  showEncryptionKeyInput: false,
};

class Login extends React.Component {
  state = initState;

  componentDidMount() {
    this.props.context.resetAuth();
    setTimeout(() => {
      RNBootSplash.hide({ duration: 250 });
      this.checkVersion();
    }, 500);
  }

  checkVersion = async () => {
    const response = await API.get({ path: '/version' });
    if (!response.ok) return;
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
  };

  toggleShowPassword = () => this.setState(({ showPassword }) => ({ showPassword: !showPassword }));

  onChange = ({ email, isValid, example }) => this.setState({ email, isValid, example });

  onPasswordChange = (password) => this.setState({ password });

  onForgetPassword = () => this.props.navigation.navigate('ForgetPassword');
  onConnect = async () => {
    const { email, isValid, example, password, showEncryptionKeyInput, encryptionKey } = this.state;
    const { navigation, context } = this.props;
    if (!isValid) {
      Alert.alert("L'email n'est pas valide.", `Il doit être de la forme ${example}`);
      this.emailInput.focus();
      return;
    }
    if (password === '') {
      Alert.alert('Mot de passe incorrect', 'Le mot de passe ne peut pas être vide');
      this.passwordInput.focus();
      return;
    }
    this.setState({ loading: true });
    const response = await API.post({ path: '/user/signin', body: { password, email }, skipEncryption: true });
    if (response.error) {
      Alert.alert(response.error, null, [{ text: 'OK', onPress: () => this.passwordInput.focus() }], {
        cancelable: true,
        onDismiss: () => this.passwordInput.focus(),
      });
      this.setState({ loading: false, password: '' });
      return;
    }
    if (response.user.role === 'superadmin') {
      Alert.alert("Vous n'avez pas d'organisation dans Mano");
      this.setState({ loading: false });
      return;
    }
    if (response.ok) {
      Keyboard.dismiss();
      API.token = response.token;
      API.showTokenExpiredError = true;
      context.setAuth({
        user: response.user,
        organisation: response.user.organisation,
      });
      if (!!response.user.organisation?.encryptionEnabled && !showEncryptionKeyInput) {
        return this.setState({ loading: false, showEncryptionKeyInput: true });
      }
      if (encryptionKey) {
        const keyIsValid = await API.setOrgEncryptionKey(encryptionKey);
        if (!keyIsValid) {
          this.setState({ loading: false });
          return;
        }
      }
      await AsyncStorage.setItem('persistent_email', email);
      const { data: teams } = await API.get({ path: '/team' });
      const { data: users } = await API.get({ path: '/user', query: { minimal: true } });
      context.setAuth({
        user: response.user,
        organisation: response.user.organisation,
        teams,
        users,
      });
      API.navigation = navigation;
      // getting teams before going to team selection
      if (!__DEV__ && !response.user.lastChangePasswordAt) {
        navigation.navigate('ForceChangePassword');
      } else {
        if (!response.user?.termsAccepted) {
          navigation.navigate('CharteAcceptance');
        } else if (response.user?.teams?.length === 1) {
          context.setCurrentTeam(response.user.teams[0]);
          this.props.context.refresh({ showFullScreen: true, initialLoad: true });
          navigation.navigate('Home');
        } else {
          navigation.navigate('TeamSelection');
        }
      }
    }
    setTimeout(() => {
      this.setState(initState);
    }, 500);
  };

  _scrollToInput = (ref) => {
    if (!ref) return;
    setTimeout(() => {
      ref.measureLayout(
        findNodeHandle(this.scrollView),
        (x, y, width, height) => {
          this.scrollView.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  render() {
    const { password, loading, showPassword, encryptionKey, showEncryptionKeyInput } = this.state;
    return (
      <Background testID="login-screen">
        <SceneContainer>
          <ScrollContainer ref={(r) => (this.scrollView = r)} keyboardShouldPersistTaps="handled">
            <View>
              <StatusBar backgroundColor={colors.app.color} />
              <Title heavy>Bienvenue !</Title>
              <SubTitle>Veuillez saisir un e-mail enregistré auprès de votre administrateur</SubTitle>
              <EmailInput
                onChange={this.onChange}
                ref={(r) => (this.emailInput = r)}
                onFocus={() => this._scrollToInput(this.emailInput)}
                onSubmitEditing={() => this.passwordInput.focus()}
              />
              <InputLabelled
                ref={(r) => (this.passwordInput = r)}
                onChangeText={(password) => this.setState({ password })}
                label="Mot de passe"
                placeholder="unSecret23!"
                onFocus={() => this._scrollToInput(this.passwordInput)}
                value={password}
                autoCompleteType="password"
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={this.onConnect}
                EndIcon={() => <EyeIcon strikedThrough={showPassword} />}
                onEndIconPress={this.toggleShowPassword}
              />
              {!!showEncryptionKeyInput && (
                <InputLabelled
                  ref={(r) => (this.encryptionKey = r)}
                  onChangeText={(encryptionKey) => this.setState({ encryptionKey })}
                  label="Clé de chiffrement"
                  placeholder="unSecret23!"
                  onFocus={() => this._scrollToInput(this.encryptionKey)}
                  value={encryptionKey}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={this.onConnect}
                  EndIcon={() => <EyeIcon strikedThrough={showPassword} />}
                  onEndIconPress={this.toggleShowPassword}
                />
              )}
              <TouchableWithoutFeedback onPress={this.onForgetPassword}>
                <Hint>J'ai oublié mon mot de passe</Hint>
              </TouchableWithoutFeedback>
              <ButtonsContainer>
                <Button caption="Connecter" onPress={this.onConnect} loading={loading} disabled={loading} />
              </ButtonsContainer>
              <Version>Mano v{version}</Version>
            </View>
          </ScrollContainer>
        </SceneContainer>
      </Background>
    );
  }
}

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

export default compose(withContext(AuthContext), withContext(RefreshContext))(Login);
