import React, { useMemo } from 'react';
import { Col, FormGroup, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import SelectAsInput from './SelectAsInput';
import SelectCustom from './SelectCustom';
import DatePicker from 'react-datepicker';
import { dateForDatePicker } from '../services/date';
import { capture } from '../services/sentry';

const CustomFieldInput = ({ field, values, handleChange, model, colWidth = 4, disabled, hideLabel = false }) => {
  const id = useMemo(() => {
    const slugifiedLabel = field.label.toLowerCase().replace(/ /g, '-').replace("'", '') ?? field.name;
    if (['text', 'number'].includes(field.type)) return `${model}-custom-input-${slugifiedLabel}`;
    if (['textarea'].includes(field.type)) return `${model}-custom-textarea-${slugifiedLabel}`;
    if (['date-with-time', 'date'].includes(field.type)) return `${model}-custom-datepicker-${slugifiedLabel}`;
    if (['boolean'].includes(field.type)) return `${model}-custom-checkbox-${slugifiedLabel}`;
    if (['yes-no'].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
    if (['enum'].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
    if (['multi-choice'].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
  }, [field, model]);

  try {
    return (
      <Col md={colWidth} key={field.name}>
        <FormGroup>
          {!hideLabel && (
            <Label data-test-id={field.label} htmlFor={id}>
              {field.type !== 'boolean' ? field.label : ''}
            </Label>
          )}
          {!!['text', 'number'].includes(field.type) && (
            <Input
              disabled={disabled}
              name={field.name}
              required={field.required}
              value={values[field.name] || ''}
              onChange={(e) => {
                if (field.type === 'text') return handleChange(e);
                if (field.type === 'number') {
                  e.persist();
                  // test the current value to have positive numbers or decimal only
                  if (!e.target.value?.length) return handleChange(e);
                  const regex = /^[0-9]*\.?[0-9]*$/;
                  if (!regex.test(e.target.value)) return;
                  if (!e.target.value?.endsWith('.')) e.target.value = Number(e.target.value);
                  handleChange(e);
                }
              }}
              id={id}
              // input type=number doesn't show leading 0, so you can't explicitely tell that the input's value is 0
              // that's why for type number we need this hack
              // the only con is that there is nomore arrows to increase/decrease the value
              // https://stackoverflow.com/a/54463605/5225096
              type="text"
              inputMode={field.type === 'number' ? 'numeric' : undefined}
            />
          )}
          {!!['textarea'].includes(field.type) && (
            <Input
              disabled={disabled}
              name={field.name}
              type="textarea"
              rows={5}
              required={field.required}
              value={values[field.name]}
              onChange={handleChange}
              id={id}
            />
          )}
          {!!['date-with-time', 'date'].includes(field.type) && (
            <div>
              <DatePicker
                locale="fr"
                className="form-control"
                id={id}
                selected={dateForDatePicker(values[field.name] ? values[field.name] : field.required ? new Date() : null)}
                onChange={(date) => handleChange({ target: { value: date, name: field.name } })}
                timeInputLabel="Heure :"
                dateFormat={`dd/MM/yyyy${field.type === 'date-with-time' ? ' HH:mm' : ''}`}
                showTimeInput={field.type === 'date-with-time'}
                disabled={disabled}
              />
            </div>
          )}
          {!!['boolean'].includes(field.type) && (
            <CheckboxContainer>
              <label htmlFor={id}>{field.label}</label>
              <Input
                type="checkbox"
                id={id}
                required={field.required}
                name={field.name}
                checked={values[field.name]}
                onChange={() => handleChange({ target: { value: !values[field.name], name: field.name } })}
                disabled={disabled}
              />
            </CheckboxContainer>
          )}
          {!!['yes-no'].includes(field.type) && (
            <SelectAsInput
              options={['Oui', 'Non']}
              name={field.name}
              value={values[field.name] || ''}
              onChange={handleChange}
              inputId={id}
              classNamePrefix={id}
              isDisabled={disabled}
            />
          )}
          {!!['enum'].includes(field.type) && (
            <SelectAsInput
              creatable={Boolean(field.allowCreateOption)}
              options={field.options}
              name={field.name}
              value={values[field.name] || ''}
              onChange={handleChange}
              inputId={id}
              classNamePrefix={id}
              isDisabled={disabled}
            />
          )}
          {!!['multi-choice'].includes(field.type) && (
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
              value={(typeof values[field.name] === 'string' ? [values[field.name]] : values[field.name])?.map((o) => ({ value: o, label: o }))}
              placeholder={' -- Choisir -- '}
              getOptionValue={(i) => i.value}
              getOptionLabel={(i) => i.label}
              isDisabled={disabled}
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
          <Label data-test-id={field.label} htmlFor={id}>
            {field.type !== 'boolean' ? field.label : ''}
          </Label>
        )}
        {JSON.stringify(values[field.name])}
      </FormGroup>
    </Col>
  );
};

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  width: 80%;
`;

export default CustomFieldInput;
