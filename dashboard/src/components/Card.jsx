import React from "react";
import HelpButtonAndModal from "./HelpButtonAndModal";

const Card = ({ title, count, unit, children, countId, dataTestId, help, onClick = null }) => {
  const Component = !!onClick ? "button" : "div";
  const props = !!onClick ? { onClick, type: "button", name: "card", className: "button-cancel" } : {};
  return (
    <>
      <div className="tw-relative tw-mb-2.5 tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-between tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-px-3 tw-pb-10 tw-pt-6 tw-font-bold">
        {!!title && (
          <div className="tw-relative">
            <p className="tw-m-0 tw-inline-block tw-text-center tw-text-lg tw-font-medium tw-text-black">
              {title} {!!help && <HelpButtonAndModal title={title} help={help} />}
            </p>
          </div>
        )}
        <Component {...props} className={["tw-flex tw-items-end tw-text-6xl tw-text-main", !!children ? "tw-mb-4" : ""].join(" ")}>
          <span data-test-id={`${dataTestId}-${count}`} id={countId}>
            {count}
          </span>
          {!!unit && <span className="tw-ml-2.5 tw-text-base">{unit}</span>}
        </Component>
        {children}
      </div>
    </>
  );
};

export default Card;
