import { useMemo } from 'react';

export default function AutoResizeTextarea({ name, value, onChange, rows = 1, placeholder = 'Description' }) {
  const style = useMemo(() => {
    return {
      minHeight: `${rows * 1.5}rem`,
    };
  }, [rows]);

  return (
    <div className="tw-relative tw-h-min tw-w-full tw-grow">
      <div aria-hidden className="tw-pointer-events-none tw-invisible tw-py-1.5 tw-px-3" placeholder={placeholder} style={style}>
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
        className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-py-1.5 tw-px-3"
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}
