export default function AutoResizeTextarea({ name, value, onChange, placeholder = 'Description' }) {
  return (
    <div className="tw-relative tw-h-min tw-w-full tw-grow">
      <div aria-hidden className="tw-pointer-events-none tw-invisible" placeholder={placeholder}>
        {value?.split('\n').map((item, key) => (
          <span key={key}>
            {item}
            <br />
          </span>
        ))}
      </div>
      <textarea
        defaultValue={value}
        name={name}
        id={name}
        onChange={onChange}
        className="tw-absolute tw-inset-0 tw-h-full tw-w-full"
        placeholder={placeholder}
      />
    </div>
  );
}
