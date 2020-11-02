import React from 'react';
import styled from 'styled-components';
import { Alert, findNodeHandle } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import API from '../../api';
import SceneContainer from '../../components/SceneContainer';
import ScrollContainer from '../../components/ScrollContainer';
import colors from '../../utils/colors';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import { clearUserToken, setUserToken } from '../../services/token';
import EmailInput from '../../services/EmailInput';
import { ERROR_MESSAGE } from '../../utils/errorMessages';
import { setEmail } from '../../services/localStorage';

class Login extends React.Component {
  state = {
    email: '',
    loading: false,
    example: 'example@example.com',
    password: '',
  };

  componentDidMount() {
    // clearUserToken();
    this.hideSplash();
  }

  hideSplash = () => {
    setTimeout(() => {
      RNBootSplash.hide({ duration: 250 });
    }, 500);
  };

  onChange = ({ email, isValid, example }) => this.setState({ email, isValid, example });

  onPasswordChange = (password) => this.setState({ password });

  onConnect = async () => {
    const { email, isValid, example, password } = this.state;
    const { navigation } = this.props;
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
    const response = await API.post({ path: '/user/signin', body: { password, email } });
    
    if (!response.ok || (response.code && ERROR_MESSAGE[response.code])) {
      Alert.alert('Échec de la connexion', response.code && ERROR_MESSAGE[response.code]);
      this.setState({ loading: false });
      this.onPasswordChange('');
      this.passwordInput.focus();
      return;
    }

    await setUserToken(response.token);
    setEmail(email);
    navigation.navigate('Home');
    setTimeout(() => {
      this.setState({ loading: false });
    }, 500);
  };

  _scrollToInput = (ref) => {
    if (!ref) return;
    setTimeout(() => {
      ref.measureLayout(
        findNodeHandle(this.scrollView),
        (x, y, width, height) => {
          this.scrollView.scrollTo({ y, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  render() {
    const { password, loading } = this.state;
    return (
      <Background>
        <SceneContainer>
          <ScrollContainer ref={(r) => (this.scrollView = r)}>
            <Title>Bienvenue !</Title>
            <SubTitle>Veuillez saisir un e-mail enregistré auprès de votre administrateur</SubTitle>
            <EmailInput
              onChange={this.onChange}
              ref={(r) => (this.emailInput = r)}
              onFocus={() => this._scrollToInput(this.emailInput)}
              onSubmitEditing={() => this.passwordInput.focus()}
            />
            <PassWordInput
              ref={(r) => (this.passwordInput = r)}
              onChangeText={this.onPasswordChange}
              placeholder={'mot de passe'}
              onFocus={() => this._scrollToInput(this.passwordInput)}
              value={password}
              textAlign={'center'}
              autoCompleteType={'password'}
              secureTextEntry={true}
              returnKeyType={'done'}
              onSubmitEditing={this.onConnect}
            />
            <ButtonsContainer>
              <Button
                caption="Connecter"
                backgroundColor={colors.menu.backgroundColor}
                color={colors.menu.color}
                borderColor={colors.menu.color}
                onPress={this.onConnect}
                loading={loading}
                disabled={loading}
              />
            </ButtonsContainer>
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

const Title = styled.Text`
  background-color: ${colors.app.color};
  padding-horizontal: 30px;
  padding-vertical: 15px;
  font-weight: bold;
  font-style: italic;
  transform: rotate(-1deg);
  font-size: 22px;
  margin-top: 20%;
  align-self: center;
  color: #fff;
`;

const SubTitle = styled.Text`
  font-size: 13px;
  margin-top: 15%;
  margin-bottom: 10%;
  align-self: center;
  text-align: center;
`;

const PassWordInput = styled.TextInput`
  height: 50px;
  border-radius: 5px;
  border-color: #000;
  color: #000;
  flex: 1;
  font-size: 20px;
  margin-left: -5px;
  margin-bottom: 10px;
  padding-left: 5px;
  padding-right: 5px;
`;

export default Login;
