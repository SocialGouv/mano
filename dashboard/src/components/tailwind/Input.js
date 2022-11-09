/*
  This example requires some changes to your config:

  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
// https://tailwindui.com/components/application-ui/forms/input-groups#component-2607d970262ada86428f063c72b1e7bd
const Input = ({ id, name, label, placeholder, type, defaultValue, ...props }) => {
  return (
    <div>
      {!!label && (
        <label htmlFor={id} className="tw-block tw-text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        name={name}
        id={id}
        className="tw-relative tw-mt-1 tw-block tw-w-full tw-rounded-md tw-border-gray-300 tw-px-2 tw-shadow-sm focus:tw-border-indigo-500 focus:tw-ring-indigo-500 sm:tw-text-sm"
        placeholder={placeholder}
        defaultValue={defaultValue}
        {...props}
      />
    </div>
  );
};

export default Input;
