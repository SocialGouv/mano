import { useEffect, useMemo, useRef, useState } from "react";

export default function AutoResizeTextarea({ name, value, onChange, rows = 1, placeholder = "Description", id }) {
  const [resizedHeight, setResizedHeight] = useState(null);
  const textbox = useRef(null);
  useEffect(() => {
    const textarea = textbox.current;
    function outputsize() {
      setResizedHeight(textarea?.offsetHeight);
    }
    const heightObserver = new ResizeObserver(outputsize);
    heightObserver.observe(textarea);
    return () => {
      try {
        if (textarea && heightObserver?.unobserve) {
          heightObserver?.unobserve?.(textarea);
        }
      } catch (error) {
        console.log(error);
      }
    };
  }, []);

  const style = useMemo(() => {
    if (resizedHeight) {
      return {
        height: resizedHeight,
        minHeight: `${rows * 1.5}rem`,
      };
    }
    return {
      minHeight: `${rows * 1.5}rem`,
    };
  }, [rows, resizedHeight]);

  return (
    <div className="tw-relative tw-h-min tw-w-full tw-grow">
      <div aria-hidden className="tw-pointer-events-none tw-invisible tw-px-3 tw-py-1.5" placeholder={placeholder} style={style}>
        {value?.split("\n").map((item, key) => (
          <span key={key}>
            {item}
            <br />
          </span>
        ))}
      </div>
      <textarea
        ref={textbox}
        defaultValue={value}
        name={name}
        id={id || name}
        onChange={onChange}
        className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-px-3 tw-py-1.5"
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}
