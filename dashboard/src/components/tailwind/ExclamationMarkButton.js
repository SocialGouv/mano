import React from 'react';

export default function ExclamationMarkButton({ ...props }) {
  return (
    <button
      type="button"
      aria-label="Urgent"
      title="Urgent"
      className="tw-ml-1 tw-inline-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-border-red-600 tw-bg-red-50 tw-text-sm tw-font-bold tw-text-red-600 tw-shadow-none"
      {...props}>
      !
    </button>
  );
}
