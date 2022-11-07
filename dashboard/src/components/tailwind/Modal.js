import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';

// https://tailwindui.com/components/application-ui/overlays/modals#component-47a5888a08838ad98779d50878d359b3

export default function Modal({ open, setOpen, title, children, buttons }) {
  const cancelButtonRef = useRef(null);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
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
              leaveTo="tw-opacity-0 tw-translate-y-4 sm:tw-translate-y-0 sm:tw-scale-95">
              <Dialog.Panel className="tw-relative tw-transform tw-overflow-hidden tw-rounded-lg tw-bg-white tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full sm:tw-max-w-lg">
                <div className="tw-bg-white tw-px-4 tw-pt-5 tw-pb-4 sm:tw-p-6 sm:tw-pb-4">
                  <div className="sm:tw-flex sm:tw-items-start">
                    <div className="tw-mt-3 tw-w-full tw-text-center sm:tw-mt-0 sm:tw-text-left">
                      <Dialog.Title as="h3" className="tw-text-lg tw-font-medium tw-leading-6 tw-text-gray-900">
                        {title}
                      </Dialog.Title>
                      <div className="tw-my-8 tw-w-full tw-px-4">{children}</div>
                    </div>
                  </div>
                </div>
                <div className="tw-bg-gray-50 tw-px-4 tw-py-3 sm:tw-flex sm:tw-flex-row-reverse sm:tw-px-6">
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
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
