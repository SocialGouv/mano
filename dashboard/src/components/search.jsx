import React, { useRef, useState, useEffect } from "react";
import { Input, InputGroup } from "reactstrap";

const Search = React.forwardRef(({ value = "", onChange = Function.prototype, placeholder = "Recherche", id = "search" }, ref) => {
  const [cachedValue, setCachedValue] = useState(value);

  const searchDebounce = useRef(null);

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      if (value !== cachedValue) onChange(cachedValue);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedValue]);

  return (
    <InputGroup>
      <Input id={id} placeholder={placeholder} value={cachedValue} onChange={(event) => setCachedValue(event.target.value)} innerRef={ref} />
    </InputGroup>
  );
});

export default Search;
