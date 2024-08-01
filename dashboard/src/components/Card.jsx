import React from "react";
import HelpButtonAndModal from "./HelpButtonAndModal";

const Card = ({ title, count, unit, children, countId, dataTestId, help, onClick = null }) => {
  dataTestId = dataTestId || title.toLocaleLowerCase().split(" ").join("-");

  const Component = onClick ? "button" : "div";
  const props = onClick ? { onClick, type: "button", name: "card", className: "button-cancel" } : {};
  return (
    <>
      <div className="tw-relative tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-main25 tw-bg-white tw-px-3 tw-py-6 tw-font-bold">
        {!!title && (
          <div className="tw-relative">
            <p className="tw-m-0 tw-inline-block tw-text-center tw-text-lg tw-font-medium tw-text-black">
              {title} {!!help && <HelpButtonAndModal title={title} help={help} />}
            </p>
          </div>
        )}
        <Component {...props} className={["tw-grow tw-flex tw-items-center tw-text-6xl tw-text-main tw-my-2"].join(" ")}>
          <div className="tw-flex tw-items-end">
            <span data-test-id={`${dataTestId}-${count}`} id={countId}>
              {count}
            </span>
            {!!unit && <span className="tw-ml-2.5 tw-mb-1 tw-text-base">{unit}</span>}
          </div>
        </Component>
        {children}
      </div>
    </>
  );
};

export default Card;
