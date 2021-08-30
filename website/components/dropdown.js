import { Disclosure } from "@headlessui/react";
import { HiChevronUp } from "react-icons/hi";

const Dropdown = ({ title, children, defaultOpen = false }) => (
  <Disclosure defaultOpen={defaultOpen}>
    {({ open }) => (
      <div>
        <Disclosure.Button className="flex justify-between w-full px-5 py-4 text-sm font-medium text-left rounded-lg text-shamrock-900 bg-shamrock-50 hover:bg-shamrock-100 focus:outline-none">
          <span>{title}</span>
          <HiChevronUp
            className={`${open ? "" : "transform rotate-180"} w-5 h-5 text-shamrock-900`}
          />
        </Disclosure.Button>
        <Disclosure.Panel className="px-5 py-6 text-sm text-black">{children}</Disclosure.Panel>
      </div>
    )}
  </Disclosure>
);

export default Dropdown;
