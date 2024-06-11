import { atom, useRecoilState } from "recoil";
import { ModalContainer, ModalFooter, ModalBody, ModalHeader } from "./tailwind/Modal";

const closedState = {
  open: false,
  options: {
    title: "Voulez-vous enregistrer cet élément ?",
    subTitle: "",
    buttons: [
      {
        text: "Enregistrer",
        onClick: async () => console.log("onClick"),
      },
      {
        text: "Ne pas enregistrer",
        onClick: async () => console.log("onBack"),
        style: "danger", // available styles: primary | secondary | cancel | danger | warning
      },
      {
        text: "Annuler",
        style: "link",
        onClick: async () => console.log("cancel"),
      },
    ],
  },
};

export const modalConfirmState = atom({
  key: "modalConfirmState",
  default: closedState,
});

const ModalConfirm = () => {
  const [
    {
      open,
      options: { title, subTitle, buttons },
    },
    setModalConfirmState,
  ] = useRecoilState(modalConfirmState);

  const close = () => setModalConfirmState((prevState) => ({ ...prevState, open: false }));

  return (
    <ModalContainer
      open={open}
      onClose={close}
      size="lg"
      onAfterLeave={() => {
        setModalConfirmState(closedState);
      }}
    >
      <ModalHeader title={title} />
      {!!subTitle && (
        <ModalBody>
          <div className="flex tw-p-4">{subTitle}</div>
        </ModalBody>
      )}
      <ModalFooter>
        {buttons.map(({ text, onClick, className }) => (
          <button
            name={text}
            key={text}
            type="button"
            className={className}
            onClick={async () => {
              onClick?.();
              close();
            }}
          >
            {text}
          </button>
        ))}
      </ModalFooter>
    </ModalContainer>
  );
};

export default ModalConfirm;
