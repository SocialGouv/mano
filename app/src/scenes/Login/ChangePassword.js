import React from 'react';
import styled from 'styled-components';
import { Alert, findNodeHandle, TouchableWithoutFeedback, View } from 'react-native';
import API from '../../services/api';
import ScrollContainer from '../../components/ScrollContainer';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import { MyText } from '../../components/MyText';

import EyeIcon from '../../icons/EyeIcon';
import InputLabelled from '../../components/InputLabelled';

const checks = {
  IS_EMPTY: (password) => password === '',
  IS_TOO_SHORT_OR_TOO_LONG: (password) => password.length < 6 || password.length > 32,
  NO_NUMBER: (password) => !/\d/.test(password),
  NO_LETTER: (password) => !/[a-zA-Z]/g.test(password),
  NO_UPPERCASE: (password) => !/[A-Z]/g.test(password),
  NO_LOWERCASE: (password) => !/[a-z]/g.test(password),
  NO_SPECIAL: (password) => !/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password),
};

const checkErrorPassword = (password) => {
  for (let check of Object.keys(checks)) {
    if (checks[check](password)) return check;
  }
  return null;
};

const codesToErrors = {
  IS_EMPTY: 'Le mot de passe ne peut pas être vide',
  IS_TOO_SHORT_OR_TOO_LONG: 'Le mot de passe doit avoir entre 6 et 32 caractères',
  NO_NUMBER: 'Le mot de passe doit avoir au moins un chiffre',
  NO_LETTER: 'Le mot de passe doit avoir au moins une lettre',
  NO_UPPERCASE: 'Le mot de passe doit avoir au moins une lettre majuscule',
  NO_LOWERCASE: 'Le mot de passe doit avoir au moins une lettre minuscule',
  NO_SPECIAL: 'Le mot de passe doit avoir au moins un caractère spécial',
};

const codesToHints = {
  IS_TOO_SHORT_OR_TOO_LONG: 'entre 6 et 32 caractères',
  NO_NUMBER: 'au moins un chiffre',
  NO_LETTER: 'au moins une lettre',
  NO_UPPERCASE: 'au moins une majuscule',
  NO_LOWERCASE: 'au moins une minuscule',
  NO_SPECIAL: 'au moins un caractère spécial',
};

class ChangePasswordBody extends React.Component {
  state = {
    password: '',
    newPassword: '',
    verifyPassword: '',
    loading: false,
    hidden: !__DEV__,
  };

  onModify = async () => {
    const { newPassword, verifyPassword, password } = this.state;
    const { onOK } = this.props;
    if (password.trim() === '') {
      Alert.alert('Mot de passe incorrect', 'Le mot de passe ne peut pas être vide');
      this.password.focus();
      return;
    }
    if (checkErrorPassword(newPassword.trim())) {
      Alert.alert(codesToErrors[checkErrorPassword(newPassword)]);
      this.newPassword.focus();
      return;
    }
    if (verifyPassword.trim() === '') {
      Alert.alert('Veuillez rentrer à nouveau le mot de passe pour vérification');
      this.verifyPassword.focus();
      return;
    }
    if (password.trim() === newPassword.trim()) {
      Alert.alert("Le nouveau mot de passe doit être différent de l'ancien");
      this.newPassword.focus();
      return;
    }
    if (newPassword.trim() !== verifyPassword.trim()) {
      Alert.alert(
        'Les nouveaux mots de passe sont différents',
        "Vous pouvez cliquer sur 'Montrer les mots de passe' pour voir les différences"
      );
      this.verifyPassword.focus();
      return;
    }
    this.setState({ loading: true });
    const response = await API.post({
      path: '/user/reset_password',
      body: { newPassword: newPassword.trim(), verifyPassword: verifyPassword.trim(), password: password.trim() },
      skipEncryption: true,
    });
    if (response.error) {
      Alert.alert(response.error);
      this.setState({ loading: false });
      return;
    }
    if (response.ok) {
      this.setState({ loading: false });
      Alert.alert('Mot de passe modifié !');
      onOK();
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
    const { password, newPassword, verifyPassword, loading, hidden } = this.state;
    return (
      <ScrollContainer ref={(r) => (this.scrollView = r)}>
        <View>
          {this.props.children}
          <InputLabelled
            ref={(r) => (this.password = r)}
            onChangeText={(password) => this.setState({ password })}
            label="Saisissez votre mot de passe"
            placeholder="Saisissez votre mot de passe"
            onFocus={() => this._scrollToInput(this.password)}
            value={password}
            autoCompleteType="password"
            autoCapitalize="none"
            secureTextEntry={hidden}
            returnKeyType="done"
            onSubmitEditing={() => this.newPassword.focus()}
            EndIcon={() => <EyeIcon strikedThrough={!hidden} />}
            onEndIconPress={() => this.setState({ hidden: !hidden })}
          />
          <InputLabelled
            ref={(r) => (this.newPassword = r)}
            onChangeText={(newPassword) => this.setState({ newPassword: newPassword.trim() })}
            label="Saisissez un nouveau mot de passe"
            placeholder="Saisissez un nouveau mot de passe"
            onFocus={() => this._scrollToInput(this.newPassword)}
            value={newPassword}
            autoCompleteType="password"
            autoCapitalize="none"
            secureTextEntry={hidden}
            returnKeyType="done"
            onSubmitEditing={() => this.verifyPassword.focus()}
            EndIcon={() => <EyeIcon strikedThrough={!hidden} />}
            onEndIconPress={() => this.setState({ hidden: !hidden })}
          />
          <PasswordHintContainer>
            {Object.keys(codesToHints).map((check, index, array) => {
              let caption = codesToHints[check];
              if (index === 0) caption = caption?.capitalize();
              if (index !== array.length - 1) caption = `${caption}, `;
              return (
                <PasswordHint key={caption} disabled={!checks[check](newPassword)}>
                  {caption}
                </PasswordHint>
              );
            })}
          </PasswordHintContainer>
          <InputLabelled
            ref={(r) => (this.verifyPassword = r)}
            onChangeText={(verifyPassword) => this.setState({ verifyPassword: verifyPassword.trim() })}
            label="Confirmez le nouveau mot de passe"
            placeholder="Confirmez le nouveau mot de passe"
            onFocus={() => this._scrollToInput(this.verifyPassword)}
            value={verifyPassword}
            autoCompleteType="password"
            autoCapitalize="none"
            secureTextEntry={hidden}
            returnKeyType="done"
            onSubmitEditing={this.onModify}
            EndIcon={() => <EyeIcon strikedThrough={!hidden} />}
            onEndIconPress={() => this.setState({ hidden: !hidden })}
          />
          <TouchableWithoutFeedback onPress={() => this.setState({ hidden: !hidden })}>
            <Hint>Montrer les mots de passe</Hint>
          </TouchableWithoutFeedback>
          <ButtonsContainer>
            <Button caption="Modifier" onPress={this.onModify} loading={loading} disabled={loading} />
          </ButtonsContainer>
        </View>
      </ScrollContainer>
    );
  }
}

const ChangePassword = ({ navigation }) => {
  return (
    <SceneContainer>
      <ScreenTitle title="Mot de passe" onBack={navigation.goBack} />
      <ChangePasswordBody onOK={navigation.goBack}>
        <SubTitle>Veuillez confirmer votre mot de passe et saisir un nouveau</SubTitle>
      </ChangePasswordBody>
    </SceneContainer>
  );
};

const SubTitle = styled(MyText)`
  font-size: 13px;
  margin-top: 15%;
  margin-bottom: 10%;
  align-self: center;
  text-align: center;
`;

const PasswordHintContainer = styled.View`
  flex-direction: row;
  margin-top: -20px;
  margin-bottom: 20px;
  width: 100%;
  flex-wrap: wrap;
`;
const PasswordHint = styled(MyText)`
  font-size: 11px;
  align-self: center;
  text-align: center;
  ${(props) => props.disabled && 'opacity: 0.3;'}
`;

const Hint = styled(MyText)`
  font-size: 13px;
  margin-top: 15%;
  margin-bottom: 10%;
  align-self: center;
  text-align: center;
  text-decoration-line: underline;
`;

export { ChangePasswordBody };
export default ChangePassword;
