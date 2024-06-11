import { useState } from "react";
import QuestionMarkButton from "./QuestionMarkButton";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "./tailwind/Modal";

const HelpButtonAndModal = ({ title, help }) => {
  const [helpOpen, setHelpOpen] = useState(false);

  if (!help) return null;

  return (
    <>
      <QuestionMarkButton title={help} aria-label={help} className="noprint tw-ml-5 tw-shrink-0" onClick={() => setHelpOpen(true)} />
      <HelpModal open={helpOpen} setOpen={setHelpOpen} title={title} help={help} />
    </>
  );
};

const HelpModal = ({ open, setOpen, title, help }) => {
  return (
    <ModalContainer open={open}>
      <ModalHeader title={title} />
      <ModalBody>
        <div className="tw-flex tw-flex-col tw-gap-4  tw-px-8 tw-py-4">
          <p className="tw-mb-0" dangerouslySetInnerHTML={{ __html: help.split("\n").join("<br>") }} />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            setOpen(false);
          }}
        >
          Fermer
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default HelpButtonAndModal;
