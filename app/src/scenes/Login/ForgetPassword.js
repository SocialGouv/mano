import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Alert, findNodeHandle, View } from 'react-native';
import API from '../../services/api';
import SceneContainer from '../../components/SceneContainer';
import ScrollContainer from '../../components/ScrollContainer';
import ButtonsContainer from '../../components/ButtonsContainer';
import Button from '../../components/Button';
import EmailInput from '../../services/EmailInput';
import Title, { SubTitle } from '../../components/Title';

const ForgetPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState('');
  const [example, setExample] = useState('example@example.com');
  const [loading, setLoading] = useState(false);
  const onChange = ({ email, isValid, example }) => {
    setEmail(email);
    setIsValid(isValid);
    setExample(example);
  };

  const onSendLink = async () => {
    if (!isValid) {
      Alert.alert("L'email n'est pas valide.", `Il doit être de la forme ${example}`);
      emailRef.current.focus();
      return;
    }
    setLoading(true);
    const response = await API.post({ path: '/user/forgot_password', body: { email }, skipEncryption: true });
    if (response.error) {
      Alert.alert(response.error);
      setLoading(false);
      return;
    }
    if (response.ok) {
      Alert.alert('Email envoyé !', "Un lien vous redirigera vers l'interface administrateur", [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      setLoading(false);
    }
  };

  const scrollViewRef = useRef(null);
  const emailRef = useRef(null);
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
        <ScrollContainer ref={scrollViewRef}>
          <View>
            <Title>Mot de passe oublié</Title>
            <SubTitle>
              Veuillez saisir un e-mail enregistré auprès de votre administrateur, nous vous enverrons un lien pour récupérer votre mot de passe dans
              l'interface administrateur
            </SubTitle>
            <EmailInput onChange={onChange} ref={emailRef} onFocus={() => _scrollToInput(emailRef)} onSubmitEditing={onSendLink} />
            <ButtonsContainer>
              <Button caption="Envoyer un lien" onPress={onSendLink} loading={loading} disabled={loading} />
            </ButtonsContainer>
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

export default ForgetPassword;
