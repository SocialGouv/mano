import { Fragment, useRef } from 'react';
import ModalContainer from './ModalContainer';

const ModalWithForm = ({ open, setOpen, title, children, buttons }) => {
  const cancelButtonRef = useRef(null);

  return (
    <ModalContainer
      cancelButtonRef={cancelButtonRef}
      title={title}
      open={open}
      setOpen={setOpen}
      Footer={() => (
        <>
          {buttons.map((button, index) => {
            if (button.type === 'submit') {
              return (
                <button
                  type="submit"
                  key={index}
                  form={button.form}
                  className="tw-inline-flex tw-w-full tw-justify-center tw-rounded-md tw-border tw-border-transparent tw-bg-main tw-px-4 tw-py-2 tw-text-base tw-font-medium tw-text-white tw-shadow-sm hover:tw-bg-main75 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-main75 focus:tw-ring-offset-2 sm:tw-ml-3 sm:tw-w-auto sm:tw-text-sm"
                  onClick={button.onClick}>
                  {button.text}
                </button>
              );
            }
            if (button.type === 'cancel') {
              return (
                <button
                  type="button"
                  key={index}
                  className="tw-mt-3 tw-inline-flex tw-w-full tw-justify-center tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-base tw-font-medium tw-text-gray-700 tw-shadow-sm hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-main focus:tw-ring-offset-2 sm:tw-mt-0 sm:tw-ml-3 sm:tw-w-auto sm:tw-text-sm"
                  onClick={() => setOpen(false)}
                  ref={cancelButtonRef}>
                  {button.text || 'Annuler'}
                </button>
              );
            }
            if (button.type === 'destructive') {
              return (
                <button
                  type="button"
                  key={index}
                  className="tw-inline-flex tw-w-full tw-justify-center tw-rounded-md tw-border tw-border-transparent tw-bg-red-600 tw-px-4 tw-py-2 tw-text-base tw-font-medium tw-text-white tw-shadow-sm hover:tw-bg-red-700 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-red-500 focus:tw-ring-offset-2 sm:tw-ml-3 sm:tw-w-auto sm:tw-text-sm"
                  onClick={button.onClick}>
                  {button.text}
                </button>
              );
            }
            return (
              <button
                type="button"
                key={index}
                className="tw-mt-3 tw-inline-flex tw-w-full tw-justify-center tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-4 tw-py-2 tw-text-base tw-font-medium tw-text-gray-700 tw-shadow-sm hover:tw-bg-gray-50 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-main focus:tw-ring-offset-2 sm:tw-mt-0 sm:tw-ml-3 sm:tw-w-auto sm:tw-text-sm"
                onClick={button.onClick}
                ref={cancelButtonRef}>
                {button.text}
              </button>
            );
          })}
        </>
      )}>
      <div className="tw-px-8">{children}</div>
    </ModalContainer>
  );
};

export default ModalWithForm;
