import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import PasswordInput from './PasswordInput';
import validator from 'validator';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../recoil/auth';
import { setOrgEncryptionKey } from '../services/api';

dayjs.extend(utc);
dayjs.extend(duration);

const maxSession = 3 * 3600;
const warnBeforeEndOfSession = 60;

const SessionCountDownLimiter = () => {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [reloadModalOpen, setReloadModalOpen] = useState(false);

  const stopwatchInterval = useRef(null);

  useEffect(() => {
    stopwatchInterval.current = setInterval(() => {
      if (sessionSeconds < maxSession) {
        setSessionSeconds(() => sessionSeconds + 1);
      } else {
        setReloadModalOpen(true);
        clearInterval(stopwatchInterval.current);
      }
    }, 1000);
    return () => clearInterval(stopwatchInterval.current);
  }, [sessionSeconds]);

  const remainingSession = maxSession - sessionSeconds;
  const date = new Date(0);
  date.setSeconds(remainingSession);
  const timeString = date.toISOString().substring(11, 19);

  return (
    <>
      <span className={['tw-mt-4', remainingSession < warnBeforeEndOfSession ? 'tw-font-bold tw-text-red-500' : ''].join(' ')}>
        Temps de session: {timeString}
      </span>
      <button
        onClick={() => setReloadModalOpen(true)}
        className={[
          'button-link !tw-m-0 !tw-justify-start !tw-p-0',
          remainingSession < warnBeforeEndOfSession ? '!tw-font-bold !tw-text-red-500' : '',
        ].join(' ')}>
        Verrouiller/Recharger
      </button>
      <ReloadModal
        open={reloadModalOpen}
        onSuccess={() => {
          setSessionSeconds(0);
          setReloadModalOpen(false);
        }}
      />
    </>
  );
};

const ReloadModal = ({ open, onSuccess }) => {
  const [encryptionKey, setEncryptionKey] = useState('');
  const organisation = useRecoilValue(organisationState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ModalContainer
      open={open}
      size="3xl"
      blurryBackground
      onAfterLeave={() => {
        setEncryptionKey('');
        setShowPassword(false);
      }}>
      <ModalHeader title="Veuillez saisir votre clé de chiffrement d'organisation" />
      <ModalBody>
        <form
          id="reconnect-encryption-key-form"
          className="tw-flex tw-flex-col tw-gap-4 tw-px-8 tw-py-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const encryptionIsValid = await setOrgEncryptionKey(encryptionKey.trim(), organisation);
            if (!encryptionIsValid) return setEncryptionKey('');
            onSuccess(false);
          }}>
          <label htmlFor="orgEncryptionKey">Clé de chiffrement d'organisation</label>
          <PasswordInput
            InputComponent="input"
            className={[
              'focus:tw-shadow-outline tw-mb-1 tw-block tw-w-full tw-rounded tw-border tw-border-teal-500 tw-bg-transparent tw-p-2 tw-leading-5 tw-text-gray-900 tw-outline-none tw-transition-all tw-duration-200 focus:tw-border-main50 focus:tw-outline-none',
              !showPassword ? 'tw-font-[password] tw-text-xs tw-tracking-widest' : '',
            ].join(' ')}
            validate={(v) => validator.isEmpty(v) && 'Ce champ est obligatoire'}
            name="orgEncryptionKey"
            type="search" // for the delete button
            autoComplete="off"
            id="orgEncryptionKey"
            autoFocus
            value={encryptionKey}
            onChange={(e) => {
              setEncryptionKey(e.target.value);
            }}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </form>
      </ModalBody>
      <ModalFooter>
        <button form="reconnect-encryption-key-form" type="submit" name="cancel" disabled={!encryptionKey.length} className="button-submit">
          Se reconnecter
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default SessionCountDownLimiter;
