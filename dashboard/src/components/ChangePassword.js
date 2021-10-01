import React, { useState } from 'react';
import styled from 'styled-components';
import { FormGroup, Input, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';

import ButtonCustom from './ButtonCustom';
import PasswordInput from './PasswordInput';

/* eslint-disable no-extend-native */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

/* eslint-disable no-extend-native */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

const checks = {
  IS_EMPTY: (password) => password === '',
  IS_TOO_SHORT_OR_TOO_LONG: (password) => password.length < 6 || password.length > 32,
  NO_NUMBER: (password) => !/\d/.test(password),
  NO_LETTER: (password) => !/[a-zA-Z]/g.test(password),
  NO_UPPERCASE: (password) => !/[A-Z]/g.test(password),
  NO_LOWERCASE: (password) => !/[a-z]/g.test(password),
  // eslint-disable-next-line no-useless-escape
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

const ChangePassword = ({ onSubmit, onFinished, withCurrentPassword }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <Formik
      initialValues={{ password: '', newPassword: '', verifyPassword: '' }}
      onSubmit={async (body, actions) => {
        try {
          if (checkErrorPassword(body.newPassword.trim())) {
            return toastr.error(codesToErrors[checkErrorPassword(body.newPassword)]);
          }
          if (body.newPassword.trim() !== body.verifyPassword.trim()) {
            return toastr.error('Les mots de passe ne sont pas identiques !');
          }
          onFinished({
            body: {
              newPassword: body.newPassword.trim(),
              verifyPassword: body.verifyPassword.trim(),
              password: body.password.trim(),
            },
          });
          const res = await onSubmit(body);
          actions.setSubmitting(false);
          if (res.ok) {
            toastr.success('Mot de passe mis à jour!');
            onFinished(true);
          }
        } catch (errorUpdatePassword) {
          console.log('error in updating password', errorUpdatePassword);
          toastr.error('Erreur', errorUpdatePassword);
        }
      }}>
      {({ values, isSubmitting, handleChange, handleSubmit }) => {
        return (
          <div autoComplete="off">
            {!!withCurrentPassword && (
              <FormGroup>
                <Label>Mot de passe</Label>
                <PasswordInput
                  InputComponent={Input}
                  value={values.password}
                  name="password"
                  onChange={handleChange}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              </FormGroup>
            )}
            <FormGroup>
              <Label>Nouveau mot de passe</Label>
              <PasswordInput
                InputComponent={Input}
                name="newPassword"
                value={values.newPassword}
                onChange={handleChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
              {Object.keys(codesToHints).map((check, index, array) => {
                let caption = codesToHints[check];
                if (index === 0) caption = caption?.capitalize();
                if (index !== array.length - 1) caption = `${caption}, `;
                return (
                  <PasswordHint key={caption} disabled={!checks[check](values.newPassword)}>
                    {caption}
                  </PasswordHint>
                );
              })}
            </FormGroup>
            <FormGroup>
              <Label>Confirmez le nouveau mot de passe</Label>
              <PasswordInput
                InputComponent={Input}
                value={values.verifyPassword}
                name="verifyPassword"
                onChange={handleChange}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            </FormGroup>
            <ButtonCustom title="Mettre à jour" type="submit" color="info" disabled={isSubmitting} onClick={handleSubmit} />
          </div>
        );
      }}
    </Formik>
  );
};

const PasswordHint = styled.span`
  font-size: 11px;
  align-self: center;
  text-align: center;
  ${(props) => props.disabled && 'opacity: 0.3;'}
`;

export default ChangePassword;
