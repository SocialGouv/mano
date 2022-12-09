import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// inspired by https://tailwindui.com/components/application-ui/overlays/modals#component-47a5888a08838ad98779d50878d359b3

/*

Use example:
<ModalContainer>
  <ModalHeader title="A title"><p>anything inside here</p></ModalHeader>
  <ModalBody><p>anything inside here</p></ModalBody>
  <ModalFooter><p>anything inside here, usually some buttons</p></ModalFooter>
</ModalContainer>


 */

const ModalContainer = ({
  children,
  open,
  onClose = null,
  // setOpen,
  className = '',
  onAfterEnter = () => null,
  onBeforeLeave = () => null,
  size = 'lg', // lg, xl, 3xl, full
}) => {
  const backgroundRef = useRef(null);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className={['tw-relative tw-z-[3000]', className].join(' ')}
          // onClose={setOpen} // uncomment this if you want backdrop click to close modal
          onClose={nullFunction} // uncomment this if you want backdrop click to NOT close modal
        >
          <Transition.Child
            as={Fragment}
            enter="tw-ease-out tw-duration-300"
            enterFrom="tw-opacity-0"
            enterTo="tw-opacity-100"
            leave="tw-ease-in tw-duration-200"
            leaveFrom="tw-opacity-100"
            leaveTo="tw-opacity-0">
            <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-transition-opacity" />
          </Transition.Child>

          <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto" ref={backgroundRef}>
            <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
              <Transition.Child
                as={Fragment}
                enter="tw-ease-out tw-duration-300"
                enterFrom="tw-opacity-0 tw-translate-y-4 sm:tw-translate-y-0 sm:tw-scale-95"
                enterTo="tw-opacity-100 tw-translate-y-0 sm:tw-scale-100"
                leave="tw-ease-in tw-duration-200"
                leaveFrom="tw-opacity-100 tw-translate-y-0 sm:tw-scale-100"
                leaveTo="tw-opacity-0 tw-translate-y-4 sm:tw-translate-y-0 sm:tw-scale-95"
                afterEnter={() => {
                  backgroundRef?.current?.scrollTo(0, 0);
                  onAfterEnter();
                }}
                beforeLeave={onBeforeLeave}>
                <Dialog.Panel
                  className={[
                    'tw-relative tw-flex tw-max-h-[90vh] tw-transform tw-flex-col tw-rounded-lg tw-bg-white tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full ',
                    size === 'lg' ? 'sm:tw-max-w-lg' : '',
                    size === 'xl' ? 'sm:tw-max-w-xl' : '',
                    size === '3xl' ? 'sm:tw-max-w-3xl' : '',
                    size === 'full' ? 'sm:tw-max-w-[90vw]' : '',
                  ].join(' ')}>
                  {children}
                  {!!onClose && (
                    <button
                      type="button"
                      aria-label="Fermer"
                      className="tw-absolute tw-top-4 tw-right-0 tw-text-gray-900 sm:tw-px-6"
                      onClick={onClose}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="tw-h-6 tw-w-6">
                        <path
                          fillRule="evenodd"
                          d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

const nullFunction = () => null;

const ModalHeader = ({ children, title }) => {
  return (
    <div className="tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-between tw-rounded-t-lg tw-border-b tw-border-gray-200 tw-bg-white">
      <div className="tw-w-full tw-py-4 sm:tw-flex sm:tw-items-start">
        <div className="tw-mt-3 tw-w-full tw-text-center sm:tw-mt-0 sm:tw-text-left">
          {!!title && (
            <Dialog.Title as="h3" className="tw-mb-0 tw-px-4 tw-text-lg tw-font-medium tw-leading-6 tw-text-gray-900 sm:tw-px-6">
              {title}
            </Dialog.Title>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalBody = ({ children, className = '' }) => {
  return (
    <div className="tw-shrink tw-bg-white tw-pb-4">
      <div className="sm:tw-flex sm:tw-items-start">
        <div className={['tw-w-full tw-text-center sm:tw-mt-0 sm:tw-text-left', className].join(' ')}>{children}</div>
      </div>
    </div>
  );
};

const ModalFooter = ({ children }) => {
  return (
    <div className="tw-shrink-0 tw-rounded-b-lg tw-border-t tw-border-gray-200 tw-bg-gray-50 tw-px-4 tw-py-3 sm:tw-flex sm:tw-flex-row-reverse sm:tw-px-6">
      {children}
    </div>
  );
};

export { ModalHeader, ModalBody, ModalFooter, ModalContainer };
