import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// https://tailwindui.com/components/application-ui/overlays/modals#component-47a5888a08838ad98779d50878d359b3

const ModalContainer = ({
  Footer,
  Header,
  children,
  title,
  open,
  setOpen,
  className = '',
  cancelButtonRef = null,
  onAfterEnter = () => null,
  onBeforeLeave = () => null,
}) => {
  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className={['tw-relative tw-z-[3000]', className].join(' ')} initialFocus={cancelButtonRef} onClose={setOpen}>
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

          <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
            <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
              <Transition.Child
                as={Fragment}
                enter="tw-ease-out tw-duration-300"
                enterFrom="tw-opacity-0 tw-translate-y-4 sm:tw-translate-y-0 sm:tw-scale-95"
                enterTo="tw-opacity-100 tw-translate-y-0 sm:tw-scale-100"
                leave="tw-ease-in tw-duration-200"
                leaveFrom="tw-opacity-100 tw-translate-y-0 sm:tw-scale-100"
                leaveTo="tw-opacity-0 tw-translate-y-4 sm:tw-translate-y-0 sm:tw-scale-95"
                afterEnter={onAfterEnter}
                beforeLeave={onBeforeLeave}>
                <Dialog.Panel className="tw-relative tw-transform tw-overflow-hidden tw-rounded-lg tw-bg-white tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full sm:tw-max-w-lg">
                  <div className="tw-bg-white tw-pt-5 tw-pb-4">
                    <div className="sm:tw-flex sm:tw-items-start">
                      <div className="tw-mt-3 tw-w-full tw-text-center sm:tw-mt-0 sm:tw-text-left">
                        {!!title && (
                          <Dialog.Title as="h3" className="tw-px-4 tw-text-lg tw-font-medium tw-leading-6 tw-text-gray-900 sm:tw-px-6">
                            {title}
                          </Dialog.Title>
                        )}
                        {!!Header && <Header />}
                        {children}
                      </div>
                    </div>
                  </div>
                  <div className="tw-bg-gray-50 tw-px-4 tw-py-3 sm:tw-flex sm:tw-flex-row-reverse sm:tw-px-6">
                    <Footer />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default ModalContainer;
