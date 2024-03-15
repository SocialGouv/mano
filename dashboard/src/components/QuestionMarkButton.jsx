import React from "react";

export default function QuestionMarkButton({ className = "", ...props }) {
  return (
    <button
      type="button"
      className={[
        className,
        "tw-ml-1 tw-inline-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-main tw-bg-white tw-text-xs tw-font-bold tw-text-main tw-shadow-none tw-transition-colors hover:tw-bg-main hover:tw-text-white",
      ].join(" ")}
      {...props}
    >
      ?
    </button>
  );
}
