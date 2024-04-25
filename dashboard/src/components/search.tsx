import React, { useRef, useState, useEffect } from "react";
import { Input, InputGroup } from "reactstrap";

type SearchProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
};

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ value = "", onChange = Function.prototype, placeholder = "Recherche", id = "search" }, ref) => {
    const [cachedValue, setCachedValue] = useState(value);

    const searchDebounce = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      clearTimeout(searchDebounce.current);
      searchDebounce.current = setTimeout(() => {
        if (value !== cachedValue) onChange(cachedValue);
      }, 500);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cachedValue]);

    return (
      <div className="tw-relative tw-flex tw-flex-wrap tw-items-stretch tw-w-full">
        <input
          className="tailwindui"
          id={id}
          placeholder={placeholder}
          value={cachedValue}
          onChange={(event) => setCachedValue(event.target.value)}
          ref={ref}
        />
      </div>
    );
  }
);

export default Search;
