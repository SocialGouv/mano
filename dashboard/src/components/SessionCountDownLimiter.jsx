import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "./tailwind/Modal";
import PasswordInput from "./PasswordInput";
import validator from "validator";
import { useRecoilValue } from "recoil";
import { organisationState, sessionInitialDateTimestamp } from "../recoil/auth";
import API, { tryFetch, tryFetchExpectOk } from "../services/api";
import { checkEncryptedVerificationKey, resetOrgEncryptionKey, setOrgEncryptionKey } from "../services/encryption";
import { toast } from "react-toastify";

dayjs.extend(utc);
dayjs.extend(duration);

const maxSession = 3 * 60 * 60; // 3 hours in s
const warnBeforeEndOfSession = 60; // 1 minute in s

const maxCookieAge = 60 * 60 * 13; // 13 hours in s, setup in /api/src/controllers/user.js

const SessionCountDownLimiter = () => {
  const [reloadModalOpen, setReloadModalOpen] = useState(false);

  const sessionStart = useRef(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState(Math.floor((Date.now() - sessionStart.current) / 1000));
  const stopwatchInterval = useRef(null);
  const sessionInitialTimestamp = useRecoilValue(sessionInitialDateTimestamp);

  useEffect(() => {
    stopwatchInterval.current = setInterval(() => {
      if (sessionSeconds < maxSession) {
        setSessionSeconds(() => Math.floor((Date.now() - sessionStart.current) / 1000));
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

  const cookieSession = Math.floor((Date.now() - sessionInitialTimestamp) / 1000);
  const remainingTimeBeforeDeconnection = maxCookieAge - cookieSession;

  if (remainingTimeBeforeDeconnection < 1) {
    tryFetchExpectOk(() => API.post({ path: "/user/logout" })).then(() => {
      window.location.href = "/auth?disconnected=1";
    });
  }

  return (
    <>
      <div className={["tw-mt-4", remainingSession < warnBeforeEndOfSession ? "tw-font-bold tw-text-red-500" : ""].join(" ")}>
        <div>Temps de session restant</div>
        <div>{timeString}</div>
      </div>
      <button
        onClick={() => setReloadModalOpen(true)}
        className={[
          "button-link !tw-m-0 !tw-justify-start !tw-p-0",
          remainingSession < warnBeforeEndOfSession ? "!tw-font-bold !tw-text-red-500" : "",
        ].join(" ")}
      >
        Verrouiller/Recharger
      </button>
      {remainingTimeBeforeDeconnection <= 60 && (
        <div className="tw-fixed tw-bottom-0 tw-left-0 tw-right-0 tw-z-50 tw-mt-4 tw-flex tw-justify-center tw-bg-white tw-p-10">
          <p className="tw-mx-auto tw-mb-0 tw-text-xl tw-font-bold tw-text-red-500">
            Vous allez être déconnecté dans {remainingTimeBeforeDeconnection} secondes
          </p>
        </div>
      )}
      <ReloadModal
        open={reloadModalOpen}
        onSuccess={() => {
          sessionStart.current = Date.now();
          setSessionSeconds(0);
          setReloadModalOpen(false);
        }}
      />
    </>
  );
};

const ReloadModal = ({ open, onSuccess }) => {
  const [encryptionKey, setEncryptionKey] = useState("");
  const organisation = useRecoilValue(organisationState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ModalContainer
      open={open}
      size="3xl"
      blurryBackground
      onAfterLeave={() => {
        setEncryptionKey("");
        setShowPassword(false);
      }}
    >
      <ModalHeader title="Veuillez saisir votre clé de chiffrement d'organisation" />
      <ModalBody>
        <form
          id="reconnect-encryption-key-form"
          className="tw-flex tw-flex-col tw-gap-4 tw-px-8 tw-py-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const organisationKey = await setOrgEncryptionKey(encryptionKey.trim());
            const encryptionIsValid = await checkEncryptedVerificationKey(organisation.encryptedVerificationKey, organisationKey);
            if (!encryptionIsValid) {
              toast.error("Clé de chiffrement invalide");
              setEncryptionKey("");
              resetOrgEncryptionKey();
              await tryFetch(() => API.post({ path: "/user/decrypt-attempt-failure" }));
              return;
            }

            await tryFetch(() => API.post({ path: "/user/decrypt-attempt-success" }));
            onSuccess(false);
          }}
        >
          <label htmlFor="orgEncryptionKey">Clé de chiffrement d'organisation</label>
          <PasswordInput
            className={[
              "focus:tw-shadow-outline tw-mb-1 tw-block tw-w-full tw-rounded tw-border tw-border-teal-500 tw-bg-transparent tw-p-2 tw-leading-5 tw-text-gray-900 tw-outline-none tw-transition-all tw-duration-200 focus:tw-border-main50 focus:tw-outline-none",
              !showPassword ? "tw-font-[password] tw-text-xs tw-tracking-widest" : "",
            ].join(" ")}
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
