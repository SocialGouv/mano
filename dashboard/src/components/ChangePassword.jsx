import React, { useState } from 'react';
import { toast } from 'react-toastify';

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

const ChangePassword = ({ onSubmit, onFinished, withCurrentPassword, centerButton }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    password: '',
    newPassword: '',
    verifyPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setChangePasswordForm({ ...changePasswordForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (checkErrorPassword(changePasswordForm.newPassword.trim())) {
        return toast.error(codesToErrors[checkErrorPassword(changePasswordForm.newPassword)]);
      }
      if (changePasswordForm.newPassword.trim() !== changePasswordForm.verifyPassword.trim()) {
        return toast.error('Les mots de passe ne sont pas identiques !');
      }
      onFinished({
        body: {
          newPassword: changePasswordForm.newPassword.trim(),
          verifyPassword: changePasswordForm.verifyPassword.trim(),
          password: changePasswordForm.password.trim(),
        },
      });
      const res = await onSubmit(changePasswordForm);
      setIsSubmitting(false);
      if (res.ok) {
        toast.success('Mot de passe mis à jour!');
        onFinished(true);
      }
    } catch (errorUpdatePassword) {
      console.log('error in updating password', errorUpdatePassword);
      toast.error(errorUpdatePassword);
    }
  };

  return (
    <form method="POST" onSubmit={handleSubmit}>
      <div autoComplete="off">
        {!!withCurrentPassword && (
          <div className="tw-mb-4">
            <label htmlFor="password">Mot de passe</label>
            <PasswordInput
              value={changePasswordForm.password}
              className="tailwindui"
              name="password"
              id="password"
              onChange={handleChange}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          </div>
        )}
        <div className="tw-mb-4">
          <label htmlFor="newPassword">Nouveau mot de passe</label>
          <PasswordInput
            name="newPassword"
            id="newPassword"
            className="tailwindui"
            value={changePasswordForm.newPassword}
            onChange={handleChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
          {Object.keys(codesToHints).map((check, index, array) => {
            let caption = codesToHints[check];
            if (index === 0) caption = caption?.capitalize();
            if (index !== array.length - 1) caption = `${caption}, `;
            return (
              <span
                className={['tw-self-center tw-text-center tw-text-xs', !checks[check](changePasswordForm.newPassword) ? 'tw-opacity-30' : ''].join(
                  ' '
                )}
                key={caption}>
                {caption}
              </span>
            );
          })}
        </div>
        <div className="tw-mb-4">
          <label htmlFor="verifyPassword">Confirmez le nouveau mot de passe</label>
          <PasswordInput
            value={changePasswordForm.verifyPassword}
            className="tailwindui"
            name="verifyPassword"
            id="verifyPassword"
            onChange={handleChange}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </div>
        <ButtonCustom
          title="Mettre à jour"
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className={['tw-mt-10', centerButton ? 'tw-mx-auto' : 'tw-ml-auto'].join(' ')}
        />
      </div>
    </form>
  );
};

export default ChangePassword;
