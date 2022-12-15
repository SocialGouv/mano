import React, { useMemo } from 'react';
import slugify from 'slugify';
import { Col, FormGroup, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import SelectAsInput from './SelectAsInput';
import SelectCustom from './SelectCustom';
import DatePicker from 'react-datepicker';
import { dateForDatePicker } from '../services/date';
import { capture } from '../services/sentry';
import SelectTeamMultiple from './SelectTeamMultiple';

const CustomFieldInput = ({ field, values, handleChange, model, colWidth = 4, disabled, hideLabel = false }) => {
  const id = useMemo(() => {
    const slugifiedLabel =
      slugify(field.label, {
        replacement: '-', // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match regex, defaults to `undefined`
        lower: true, // convert to lower case, defaults to `false`
        strict: true, // strip special characters except replacement, defaults to `false`
        locale: 'fr', // language code of the locale to use
        trim: true, // trim leading and trailing replacement chars, defaults to `true`
      }) ?? field.name;
    if (['text', 'number'].includes(field.type)) return `${model}-custom-input-${slugifiedLabel}`;
    if (['textarea'].includes(field.type)) return `${model}-custom-textarea-${slugifiedLabel}`;
    if (['date-with-time', 'date'].includes(field.type)) return `${model}-custom-datepicker-${slugifiedLabel}`;
    if (['boolean'].includes(field.type)) return `${model}-custom-checkbox-${slugifiedLabel}`;
    if (['yes-no'].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
    if (['enum'].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
    if (['multi-team', 'multi-choice'].includes(field.type)) return `${model}-custom-select-${slugifiedLabel}`;
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
              type={field.type}
              required={field.required}
              value={values[field.name] || ''}
              onChange={handleChange}
              id={id}
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
              options={field.options.map((o) => ({ value: o, label: o }))}
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
          {['multi-teams'].includes(field.type) && (
            <SelectTeamMultiple
              onChange={(teamIds) => handleChange({ target: { value: teamIds, name: field.name } })}
              value={values[field.name]}
              colored
              inputId={id}
              classNamePrefix={id}
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
