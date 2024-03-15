import React, { useState } from "react";
import { toast } from "react-toastify";

import { useRecoilValue } from "recoil";
import { userState } from "../recoil/auth";
import { ModalBody, ModalContainer, ModalHeader, ModalFooter } from "./tailwind/Modal";

const DeleteButtonAndConfirmModal = ({
  title,
  children,
  textToConfirm,
  onConfirm,
  buttonWidth = null,
  roles = ["admin", "superadmin"],
  roleErrorMessage = "Désolé, seul un admin peut supprimer ce type d'élément",
  disabled = false,
  disabledTitle = "Vous n'avez pas le droit de supprimer cet élément",
}) => {
  const user = useRecoilValue(userState);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        title={disabled ? disabledTitle : title}
        className={["button-destructive", disabled ? "tw-cursor-not-allowed" : ""].join(" ")}
        onClick={() => {
          if (!roles.includes(user.role)) return toast.error(roleErrorMessage);
          setOpen(true);
        }}
        disabled={disabled}
        aria-disabled={disabled}
        style={buttonWidth ? { width: buttonWidth } : {}}
      >
        Supprimer
      </button>
      <ModalContainer open={open} toggle={() => setOpen(false)} size="3xl">
        <ModalHeader>
          <div className="tw-px-4">
            <p className="tw-block tw-text-center tw-text-xl tw-text-red-500">{title}</p>
          </div>
        </ModalHeader>
        <ModalBody className="tw-py-4">
          {children}
          <p className="tw-mb-8 tw-block tw-w-full tw-text-center">
            Veuillez taper le texte ci-dessous pour confirmer
            <br />
            en respectant les majuscules, minuscules ou accents
            <br />
          </p>
          <p className="tw-flex tw-justify-center tw-break-all tw-text-center">
            <b className="tw-block tw-text-center tw-text-red-500">{textToConfirm}</b>
          </p>
          <form
            id={`delete-${textToConfirm}`}
            onSubmit={async (e) => {
              e.preventDefault();
              const _textToConfirm = Object.fromEntries(new FormData(e.target))?.textToConfirm;
              if (!_textToConfirm) return toast.error("Veuillez rentrer le texte demandé");
              if (_textToConfirm.trim().toLocaleLowerCase() !== textToConfirm.trim().toLocaleLowerCase()) {
                return toast.error("Le texte renseigné est incorrect");
              }
              if (_textToConfirm.trim() !== textToConfirm.trim()) {
                return toast.error("Veuillez respecter les minuscules/majuscules");
              }
              await onConfirm();
              setOpen(false);
            }}
            className="tw-flex tw-w-full tw-items-center tw-justify-center tw-px-12"
          >
            <input className="tailwindui tw-basis-1/2" name="textToConfirm" placeholder={textToConfirm} type="text" />
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
            Annuler
          </button>
          <button type="submit" className="button-destructive" form={`delete-${textToConfirm}`}>
            Supprimer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

export default DeleteButtonAndConfirmModal;
