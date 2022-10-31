import React, { useMemo } from 'react';
import { Col, FormGroup, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import SelectAsInput from './SelectAsInput';
import SelectCustom from './SelectCustom';
import DatePicker from 'react-datepicker';
import { dateForDatePicker } from '../services/date';

const CustomFieldInput = ({ field, values, handleChange, model, colWidth = 4, disabled, hideLabel = false }) => {
  const id = useMemo(() => {
    if (['text', 'number'].includes(field.type)) return `${model}-custom-input-${field.name}`;
    if (['textarea'].includes(field.type)) return `${model}-custom-textarea-${field.name}`;
    if (['date-with-time', 'date'].includes(field.type)) return `${model}-custom-datepicker-${field.name}`;
    if (['boolean'].includes(field.type)) return `${model}-custom-checkbox-${field.name}`;
    if (['yes-no'].includes(field.type)) return `${model}-custom-select-${field.name}`;
    if (['enum'].includes(field.type)) return `${model}-custom-select-${field.name}`;
    if (['multi-choice'].includes(field.type)) return `${model}-custom-select-${field.name}`;
  }, [field, model]);

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
            options={field.options}
            name={field.name}
            onChange={(v) => handleChange({ currentTarget: { value: v, name: field.name } })}
            isClearable={false}
            isMulti
            inputId={id}
            classNamePrefix={id}
            value={values[field.name]}
            placeholder={' -- Choisir -- '}
            getOptionValue={(i) => i}
            getOptionLabel={(i) => i}
            isDisabled={disabled}
          />
        )}
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
