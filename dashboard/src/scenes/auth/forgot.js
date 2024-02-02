import React, { useState } from 'react';
import validator from 'validator';
import { toast } from 'react-toastify';
import ButtonCustom from '../../components/ButtonCustom';
import API from '../../services/api';
import { useRecoilValue } from 'recoil';
import { deploymentShortCommitSHAState } from '../../recoil/version';

const View = () => {
  const [done, setDone] = useState(false);
  const deploymentCommit = useRecoilValue(deploymentShortCommitSHAState);

  const [resetForm, setResetForm] = useState({
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [resetFormErrors, setResetFormErrors] = useState({
    email: '',
  });

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const emailError = !validator.isEmail(resetForm.email) ? 'Adresse email invalide' : '';
      if (emailError) {
        setShowErrors(true);
        setResetFormErrors({ email: emailError });
        return;
      }
      setIsSubmitting(true);
      const response = await API.post({
        path: '/user/forgot_password',
        body: resetForm,
      });
      setIsSubmitting(false);
      if (response.ok) setDone(true);
    } catch (errorPasswordReset) {
      toast.error(errorPasswordReset);
    }
  };

  const handleChange = (e) => {
    setShowErrors(false);
    setResetForm((form) => ({ ...form, [e.target.name]: e.target.value }));
  };

  if (done) {
    return (
      <div className="tw-mx-10 tw-my-0 tw-w-full tw-max-w-lg tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-white tw-px-7 tw-pt-10 tw-pb-2 tw-text-black tw-shadow-[0_0_20px_0_rgba(0,0,0,0.2)]">
        <h1 className="tw-mb-6 tw-text-center tw-text-3xl tw-font-bold">Réinitialiser le mot de passe</h1>
        <p className="tw-mb-8 tw-px-8 tw-text-center  tw-text-base tw-text-black50">
          Si l'adresse de courriel que vous avez saisie correspond effectivement à un compte utilisateur(rice) MANO, alors un lien pour réinitialiser
          le mot de passe de ce compte a été envoyé à l'instant à cette adresse.
        </p>
        <p className="tw-mx-auto tw-mt-5 tw-mb-0 tw-block tw-text-center tw-text-xs tw-text-gray-500">Version&nbsp;: {deploymentCommit}</p>
      </div>
    );
  }

  return (
    <div className="tw-mx-10 tw-my-0 tw-w-full tw-max-w-lg tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-bg-white tw-px-7 tw-pt-10 tw-pb-2 tw-text-black tw-shadow-[0_0_20px_0_rgba(0,0,0,0.2)]">
      <h1 className="tw-mb-6 tw-text-center tw-text-3xl tw-font-bold">Réinitialiser le mot de passe</h1>
      <p className="tw-mb-8 tw-px-8 tw-text-center  tw-text-base tw-text-black50">
        Entrez votre email ci-dessous pour recevoir le lien de réinitialisation du mot de passe.
      </p>
      <form onSubmit={handleSubmit} method="POST">
        <div className="tw-mb-6">
          <div className="tw-flex tw-flex-col-reverse">
            <input
              name="email"
              type="email"
              id="email"
              className="tw-mb-1.5 tw-block tw-w-full tw-rounded tw-border tw-border-main75 tw-bg-transparent tw-p-2.5 tw-text-black tw-outline-main tw-transition-all"
              autoComplete="email"
              placeholder="Cliquez ici pour entrer votre email"
              value={resetForm.email}
              onChange={handleChange}
            />
            <label htmlFor="email">Email </label>
          </div>
          {!!showErrors && <p className="tw-text-xs tw-text-red-500">{resetFormErrors.email}</p>}
        </div>
        <ButtonCustom
          loading={isSubmitting}
          type="submit"
          color="primary"
          title="Envoyez un lien"
          onClick={handleSubmit}
          className="tw-m-auto !tw-mt-8 !tw-w-56 tw-font-[Helvetica] !tw-text-base tw-font-medium"
        />
        <p className="tw-mx-auto tw-mt-5 tw-mb-0 tw-block tw-text-center tw-text-xs tw-text-gray-500">Version&nbsp;: {deploymentCommit}</p>
      </form>
    </div>
  );
};

export default View;
