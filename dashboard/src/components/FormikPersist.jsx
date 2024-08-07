import { useEffect, useRef } from "react";
import { useFormikContext } from "formik";
import { useDebouncedCallback } from "use-debounce";

const FormikPersist = ({ name }) => {
  const { values, setValues } = useFormikContext();
  const prefValuesRef = useRef();

  const onSave = (values) => {
    window.sessionStorage.setItem(name, JSON.stringify(values));
  };

  const debouncedOnSave = useDebouncedCallback(onSave, 300);

  useEffect(() => {
    if (JSON.stringify(prefValuesRef.current) !== JSON.stringify(values)) {
      debouncedOnSave(values);
    }
  });

  useEffect(() => {
    const savedForm = window.sessionStorage.getItem(name);

    if (savedForm) {
      const parsedForm = JSON.parse(savedForm);

      prefValuesRef.current = parsedForm;
      setValues(parsedForm);
    }
  }, [name, setValues]);

  useEffect(
    () => () => {
      debouncedOnSave.flush();
    },
    [debouncedOnSave]
  );

  useEffect(() => {
    prefValuesRef.current = values;
  });

  return null;
};

export default FormikPersist;
