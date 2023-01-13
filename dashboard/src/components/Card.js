import React, { useState } from 'react';
import QuestionMarkButton from './QuestionMarkButton';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import { capture } from '../services/sentry';

const Card = ({ title, count, unit, children, countId, dataTestId, help }) => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div className="tw-relative tw-mb-2.5 tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-px-3 tw-pt-6 tw-pb-10 tw-font-bold">
        {!!title && (
          <div className="tw-relative">
            <p className="tw-m-0 tw-inline-block tw-text-center tw-text-lg tw-font-medium tw-text-black">{title}</p>
            {!!help && <QuestionMarkButton title={help} aria-label={help} className="noprint tw-ml-5" onClick={() => setHelpOpen(true)} />}
          </div>
        )}
        <div className={['flex tw-items-end tw-text-6xl tw-text-main', !!children ? 'tw-mb-4' : ''].join(' ')}>
          <span data-test-id={`${dataTestId}-${count}`} id={countId}>
            {count}
          </span>
          {!!unit && <span className="tw-ml-2.5 tw-text-base">{unit}</span>}
        </div>
        {children}
      </div>
      {!!help && <HelpModal open={helpOpen} setOpen={setHelpOpen} title={title} help={help} />}
    </>
  );
};

const HelpModal = ({ open, setOpen, title, help }) => {
  return (
    <ModalContainer open={open}>
      <ModalHeader title={title} />
      <ModalBody>
        <div className="tw-flex tw-flex-col tw-gap-4  tw-px-8 tw-py-4">
          <p className="tw-mb-0" dangerouslySetInnerHTML={{ __html: help.split('\n').join('<br>') }} />
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          name="cancel"
          className="button-cancel"
          onClick={() => {
            capture(`Pas compris l'aide de: ${title}`);
            setOpen(false);
          }}>
          Je n'ai pas compris
        </button>
        <button
          type="button"
          name="cancel"
          className="button-submit"
          onClick={() => {
            setOpen(false);
          }}>
          OK merci !
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default Card;
