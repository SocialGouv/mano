import React from 'react';
import styled from 'styled-components';
import { Alert, findNodeHandle, View } from 'react-native';
import API from '../../services/api';
import SceneContainer from '../../components/SceneContainer';
import ScrollContainer from '../../components/ScrollContainer';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import EmailInput from '../../services/EmailInput';
import Title, { SubTitle } from '../../components/Title';

class ForgetPassword extends React.Component {
  state = {
    email: '',
    loading: false,
    example: 'example@example.com',
  };

  onChange = ({ email, isValid, example }) => this.setState({ email, isValid, example });

  onSendLink = async () => {
    const { email, isValid, example } = this.state;
    const { navigation } = this.props;
    if (!isValid) {
      Alert.alert("L'email n'est pas valide.", `Il doit être de la forme ${example}`);
      this.emailInput.focus();
      return;
    }
    this.setState({ loading: true });
    const response = await API.post({ path: '/user/forgot_password', body: { email }, skipEncryption: true });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ loading: false });
      return;
    }
    if (response.ok) {
      Alert.alert('Email envoyé !', "Un lien vous redirigera vers l'interface administrateur", [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      this.setState({ loading: false });
    }
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
    const { loading } = this.state;
    return (
      <Background>
        <SceneContainer>
          <ScrollContainer ref={(r) => (this.scrollView = r)}>
            <View>
              <Title>Mot de passe oublié</Title>
              <SubTitle>
                Veuillez saisir un e-mail enregistré auprès de votre administrateur, nous vous enverrons un lien pour
                récupérer votre mot de passe dans l'interface administrateur
              </SubTitle>
              <EmailInput
                onChange={this.onChange}
                ref={(r) => (this.emailInput = r)}
                onFocus={() => this._scrollToInput(this.emailInput)}
                onSubmitEditing={this.onSendLink}
              />
              <ButtonsContainer>
                <Button caption="Envoyer un lien" onPress={this.onSendLink} loading={loading} disabled={loading} />
              </ButtonsContainer>
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

export default ForgetPassword;
