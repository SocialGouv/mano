import AsyncStorage from '@react-native-community/async-storage';
import React, { useEffect, useState } from 'react';
import InputLabelled from '../components/InputLabelled';

const emailValidatorRE = new RegExp(
  '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))' +
    '@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
);
const validateEmail = (email) => {
  return emailValidatorRE.test(String(email).toLowerCase());
};

const EmailInput = ({ innerRef, onChange, onFocus, onSubmitEditing, testID = 'email' }) => {
  const [email, setEmail] = useState('');
  const onInputChange = (email) => {
    email = email.trim();
    setEmail(email);
    onChange({
      email: email,
      isValid: validateEmail(email),
      example: 'example@example.com',
    });
  };

  useEffect(() => {
    (async () => {
      const storedEmail = await AsyncStorage.getItem('persistent_email');
      if (storedEmail) onInputChange(storedEmail);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <InputLabelled
      label="Email"
      ref={innerRef}
      onChangeText={onInputChange}
      value={email}
      onFocus={onFocus}
      placeholder="example@example.com"
      autoCapitalize="none"
      autoCorrect={false}
      autoCompleteType="email"
      keyboardType="email-address"
      textContentType="emailAddress"
      returnKeyType="next"
      onSubmitEditing={onSubmitEditing}
      testID={testID}
    />
  );
};

export default React.forwardRef((props, ref) => <EmailInput innerRef={ref} {...props} />);
