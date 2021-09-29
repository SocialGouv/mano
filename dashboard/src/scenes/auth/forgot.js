import React, { useState } from 'react';
import { FormGroup } from 'reactstrap';
import { Formik, Field } from 'formik';
import classnames from 'classnames';
import validator from 'validator';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';

import API from '../../services/api';
import { theme } from '../../config';
import ButtonCustom from '../../components/ButtonCustom';

const View = () => {
  const [done, setDone] = useState(false);

  const validateEmail = (value) => {
    if (!validator.isEmail(value)) {
      return 'Invalid email address';
    }
  };

  if (done) {
    return (
      <AuthWrapper>
        <Title>Réinitialiser le mot de passe</Title>
        <HowReset>
          Si l'adresse de courriel que vous avez saisie correspond effectivement à un compte utilisateur.rice MANO, alors un lien pour réinitialiser
          le mot de passe de ce compte a été envoyé à l'instant à cette adresse.
        </HowReset>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <Title>Réinitialiser le mot de passe</Title>
      <HowReset>Entrez votre email ci-dessous pour recevoir le lien de réinitialisation du mot de passe.</HowReset>
      <Formik
        initialValues={{ email: '' }}
        onSubmit={async (body, actions) => {
          try {
            API.toastr = toastr;
            const response = await API.post({
              path: '/user/forgot_password',
              skipEncryption: '/user/forgot_password',
              body,
            });
            actions.setSubmitting(false);
            if (response.ok) toastr.success('Envoyé');
            setDone(true);
          } catch (errorPasswordReset) {
            toastr.error('Erreur', errorPasswordReset);
          }
        }}>
        {({ values, errors, isSubmitting, handleChange, handleSubmit }) => {
          return (
            <form onSubmit={handleSubmit}>
              <StyledFormGroup>
                <div>
                  <InputField
                    validate={validateEmail}
                    className={classnames({ 'has-error': errors.email })}
                    name="email"
                    type="email"
                    id="email"
                    value={values.email}
                    onChange={handleChange}
                  />
                  <label htmlFor="email">Email</label>
                </div>
                <p style={{ fontSize: 12, color: 'rgb(253, 49, 49)' }}>{errors.email}</p>
              </StyledFormGroup>
              <Submit type="submit" color="success" loading={isSubmitting} title="Envoyez un lien" />
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
  overflow: hidden;
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

const HowReset = styled.div`
  font-size: 16px;
  text-align: center;
  margin-bottom: 30px;
  padding: 0 30px;
  color: #555;
`;

const Submit = styled(ButtonCustom)`
  font-family: Helvetica;
  width: 220px;
  border-radius: 30px;
  margin: auto;
  font-size: 16px;
  padding: 8px;
  min-height: 42px;
`;

const InputField = styled(Field)`
  background-color: transparent;
  outline: 0;
  display: block;
  width: 100%;
  padding: 0.625rem;
  margin-bottom: 0.375rem;
  border-radius: 4px;
  border: 1px solid #a7b0b7;
  color: #252b2f;
  -webkit-transition: border 0.2s ease;
  transition: border 0.2s ease;
  line-height: 1.2;
  &:focus {
    outline: none;
    border: 1px solid ${theme.main}CC;
    & + label {
      color: ${theme.main}CC;
    }
  }
`;

const StyledFormGroup = styled(FormGroup)`
  margin-bottom: 25px;
  div {
    display: flex;
    flex-direction: column-reverse;
  }
`;

export default View;
