import { Fragment, forwardRef, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";

// inspired by https://tailwindui.com/components/application-ui/overlays/modals#component-47a5888a08838ad98779d50878d359b3

/*

Use example:
<ModalContainer>
  <ModalHeader title="A title"><p>anything inside here</p></ModalHeader>
  <ModalBody><p>anything inside here</p></ModalBody>
  <ModalFooter><p>anything inside here, usually some buttons</p></ModalFooter>
</ModalContainer>


 */

interface ModalContainerProps {
  children: React.ReactNode;
  open: boolean;
  onClose?: null | (() => void);
  className?: string;
  onAfterEnter?: () => void;
  onAfterLeave?: () => void;
  onBeforeLeave?: () => void;
  size?: "lg" | "xl" | "3xl" | "full" | "prose";
  blurryBackground?: boolean; // if true, the background will be blurred
}

const ModalContainer = ({
  children,
  open,
  onClose = null,
  // setOpen,
  className = "",
  onAfterEnter = () => null,
  onAfterLeave = () => null,
  onBeforeLeave = () => null,
  size = "lg", // lg, xl, 3xl, full, prose
  blurryBackground = false,
}: ModalContainerProps) => {
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className={["tw-relative tw-z-[100]", className].join(" ")}
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
            leaveTo="tw-opacity-0"
          >
            <div className={["tw-fixed tw-inset-0 tw-bg-black/70 tw-transition-opacity ", blurryBackground ? "tw-backdrop-blur-xl" : ""].join(" ")} />
          </Transition.Child>

          <div className="tw-fixed tw-inset-0 tw-z-[101] tw-overflow-y-auto" ref={backgroundRef}>
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
                beforeLeave={onBeforeLeave}
                afterLeave={onAfterLeave}
              >
                <Dialog.Panel
                  className={[
                    "tw-relative tw-flex tw-max-h-[90vh] tw-transform tw-flex-col tw-overflow-hidden tw-rounded-lg tw-bg-white tw-text-left tw-shadow-xl tw-transition-all sm:tw-my-8 sm:tw-w-full",
                    size === "lg" ? "sm:tw-max-w-lg" : "",
                    size === "xl" ? "sm:tw-max-w-xl" : "",
                    size === "3xl" ? "sm:tw-max-w-3xl" : "",
                    size === "full" ? "sm:tw-max-w-[90vw]" : "",
                    size === "prose" ? "sm:tw-max-w-prose" : "",
                  ].join(" ")}
                >
                  {children}
                  {!!onClose && (
                    <button
                      type="button"
                      aria-label="Fermer"
                      className="tw-absolute tw-right-0 tw-top-4 tw-text-gray-900 sm:tw-px-6"
                      onClick={onClose}
                    >
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

interface ModalHeaderProps {
  children?: React.ReactNode;
  title?: string | React.ReactNode;
  onClose?: null | (() => void);
}

const ModalHeader = ({ children, title, onClose }: ModalHeaderProps) => {
  return (
    <div className="tw-z-[103] tw-order-1 tw-flex tw-w-full tw-max-w-full tw-shrink-0 tw-items-center tw-justify-between tw-rounded-t-lg tw-border-b tw-border-gray-200 tw-bg-white">
      <div className="tw-w-full tw-py-4 sm:tw-flex sm:tw-items-start">
        <div className="tw-mt-3 tw-w-full tw-text-center sm:tw-mt-0 sm:tw-text-left">
          {!!title && (
            <Dialog.Title as="h3" className="tw-mb-0 tw-px-4 tw-text-lg tw-font-medium tw-leading-6 tw-text-gray-900 sm:tw-px-6">
              {title}
            </Dialog.Title>
          )}
          {children}
          {!!onClose && (
            <button type="button" aria-label="Fermer" className="tw-absolute tw-right-0 tw-top-4 tw-text-gray-900 sm:tw-px-6" onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="tw-h-6 tw-w-6">
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  overflowY?: boolean;
}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(({ children, className = "", overflowY = true }, ref) => {
  return (
    <div ref={ref} className={["tw-z-[102] tw-order-2 tw-shrink", overflowY ? "tw-overflow-y-auto" : ""].join(" ")}>
      <div className="sm:tw-flex sm:tw-items-start">
        <div className={["tw-w-full tw-text-center sm:tw-mt-0 sm:tw-text-left", className].join(" ")}>{children}</div>
      </div>
    </div>
  );
});

interface ModalFooterProps {
  children: React.ReactNode;
}

const ModalFooter = ({ children }: ModalFooterProps) => {
  return (
    <div className="tw-order-3 tw-flex tw-shrink-0 tw-justify-end tw-gap-3 tw-rounded-b-lg tw-border-t tw-border-gray-200 tw-bg-gray-50 tw-px-4 tw-py-3 sm:tw-px-6">
      {children}
    </div>
  );
};

export { ModalHeader, ModalBody, ModalFooter, ModalContainer };
