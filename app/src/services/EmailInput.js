import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getEmail } from './localStorage';

const emailValidatorRE = new RegExp(
  '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))' +
    '@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
);
const validateEmail = (email) => {
  return emailValidatorRE.test(String(email).toLowerCase());
};

const usePersistentEmail = (setEmail) => {
  useEffect(() => {
    (async () => {
      const email = await getEmail();
      setEmail(email);
    })();
    return () => {};
  }, []);
};

const EmailInput = ({ innerRef, onChange, onFocus, onSubmitEditing }) => {
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
  usePersistentEmail(onInputChange);
  return (
    <EmailInputStyled
      ref={innerRef}
      onChangeText={onInputChange}
      value={email}
      onFocus={onFocus}
      placeholder={'example@example.com'}
      textAlign={'center'}
      autoCapitalize={'none'}
      autoCorrect={false}
      autoCompleteType={'email'}
      keyboardType={'email-address'}
      textContentType={'emailAddress'}
      returnKeyType={'next'}
      onSubmitEditing={onSubmitEditing}
    />
  );
};

const EmailInputStyled = styled.TextInput`
  height: 50px;
  border-radius: 8px;
  border: 1px solid #666;
  color: #000;
  flex: 1;
  font-size: 20px;
  margin-bottom: 10px;
  padding-left: 5px;
  padding-right: 5px;
`;

export default React.forwardRef((props, ref) => <EmailInput innerRef={ref} {...props} />);
