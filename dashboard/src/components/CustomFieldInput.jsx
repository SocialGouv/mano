import { useMemo } from "react";
import { Col, FormGroup } from "reactstrap";
import SelectAsInput from "./SelectAsInput";
import SelectCustom from "./SelectCustom";
import { capture } from "../services/sentry";
import DatePicker from "./DatePicker";

const CustomFieldInput = ({ field, values, handleChange, model, colWidth = null, disabled = false, hideLabel = false }) => {
  const id = useMemo(() => {
    const slugifiedLabel =
      field.label
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[\\(\\)]/g, "")
        .replace("'", "") ?? field.name;
    if (["text", "number"].includes(field.type)) return `${model}-custom-input-${slugifiedLabel}`;
    if (["textarea"].includes(field.type)) return `${model}-custom-textarea-${slugifiedLabel}`;
    if (["date-with-time", "date", "duration"].includes(field.type)) return `${model}-custom-datepicker-${slugifiedLabel}`;
    if (["boolean"].includes(field.type)) return `${model}-custom-checkbox-${slugifiedLabel}`;
    if (["yes-no"].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
    if (["enum"].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
    if (["multi-choice"].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
  }, [field, model]);

  if (!colWidth) colWidth = field.type === "textarea" ? 12 : 4;

  try {
    return (
      <Col md={colWidth} key={field.name}>
        <FormGroup>
          {!hideLabel && (
            <label className="tw-text-sm tw-font-semibold tw-text-gray-600" data-test-id={field.label} htmlFor={id}>
              {field.label}
            </label>
          )}
          {!!["text", "number"].includes(field.type) && (
            <input
              disabled={disabled}
              name={field.name}
              className="tailwindui"
              autoComplete="off"
              required={field.required}
              value={values[field.name] || ""}
              onChange={(e) => {
                if (field.type === "text") return handleChange(e);
                if (field.type === "number") {
                  e.persist();
                  // test the current value to have positive numbers or decimal only
                  if (!e.target.value?.length) return handleChange(e);
                  const regex = /^[0-9]*\.?[0-9]*$/;
                  if (!regex.test(e.target.value)) return;
                  if (!e.target.value?.endsWith(".")) e.target.value = Number(e.target.value);
                  handleChange(e);
                }
              }}
              id={id}
              // input type=number doesn't show leading 0, so you can't explicitely tell that the input's value is 0
              // that's why for type number we need this hack
              // the only con is that there is nomore arrows to increase/decrease the value
              // https://stackoverflow.com/a/54463605/5225096
              type="text"
              inputMode={field.type === "number" ? "numeric" : undefined}
            />
          )}
          {!!["textarea"].includes(field.type) && (
            <textarea
              disabled={disabled}
              className="tailwindui"
              name={field.name}
              rows={5}
              required={field.required}
              value={values[field.name]}
              onChange={handleChange}
              id={id}
            />
          )}
          {!!["date-with-time", "date", "duration"].includes(field.type) && (
            <div>
              <DatePicker
                withTime={field.type === "date-with-time"}
                id={id}
                defaultValue={values[field.name] ? values[field.name] : field.required ? new Date() : null}
                onChange={(e) => {
                  handleChange({ target: { value: e.target.value, name: field.name } });
                }}
                disabled={disabled}
              />
            </div>
          )}
          {!!["boolean"].includes(field.type) && (
            /*
              display: flex;
  flex-direction: column;
  margin-left: 20px;
  width: 80%;
            */
            <div className="tw-basis-full tw-p-4">
              <label htmlFor={id}>
                <input
                  type="checkbox"
                  id={id}
                  required={field.required}
                  name={field.name}
                  checked={values[field.name]}
                  onChange={() => handleChange({ target: { value: !values[field.name], name: field.name } })}
                  disabled={disabled}
                  className="tw-mr-2"
                />
                {field.label}
              </label>
            </div>
          )}
          {!!["yes-no"].includes(field.type) && (
            <SelectAsInput
              options={["Oui", "Non"]}
              name={field.name}
              value={values[field.name] || ""}
              onChange={handleChange}
              inputId={id}
              classNamePrefix={id}
              isDisabled={disabled}
            />
          )}
          {!!["enum"].includes(field.type) && (
            <SelectAsInput
              creatable={Boolean(field.allowCreateOption)}
              options={field.options}
              name={field.name}
              value={values[field.name] || ""}
              onChange={handleChange}
              inputId={id}
              classNamePrefix={id}
              isDisabled={disabled}
              formatCreateLabel={(inputValue) => `Autre : "${inputValue}"`}
            />
          )}
          {!!["multi-choice"].includes(field.type) && (
            <SelectCustom
              creatable={Boolean(field.allowCreateOption)}
              options={(field.options || []).map((o) => ({ value: o, label: o }))}
              name={field.name}
              onChange={(values) => {
                handleChange({ currentTarget: { value: values.map((o) => o.value), name: field.name } });
              }}
              isClearable={false}
              isMulti
              inputId={id}
              classNamePrefix={id}
              value={(typeof values[field.name] === "string" ? [values[field.name]] : values[field.name])?.map((o) => ({ value: o, label: o }))}
              placeholder={"Choisir..."}
              getOptionValue={(i) => i.value}
              getOptionLabel={(i) => i.label}
              isDisabled={disabled}
              formatCreateLabel={(inputValue) => `Autre : "${inputValue}"`}
            />
          )}
        </FormGroup>
      </Col>
    );
  } catch (e) {
    capture(e, { extra: { field, values, model, colWidth, disabled, hideLabel } });
  }
  return (
    <Col md={colWidth} key={field.name}>
      <FormGroup>
        {!hideLabel && (
          <label className="tw-text-sm tw-font-semibold tw-text-gray-600" data-test-id={field.label} htmlFor={id}>
            {field.type !== "boolean" ? field.label : ""}
          </label>
        )}
        {JSON.stringify(values[field.name])}
      </FormGroup>
    </Col>
  );
};

export default CustomFieldInput;
