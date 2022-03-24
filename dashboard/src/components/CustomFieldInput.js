import React from 'react';
import { Col, FormGroup, Input, Label } from 'reactstrap';
import 'react-datepicker/dist/react-datepicker.css';
import styled from 'styled-components';
import SelectAsInput from './SelectAsInput';
import SelectCustom from './SelectCustom';
import DatePicker from 'react-datepicker';
import { dateForDatePicker } from '../services/date';

const CustomFieldInput = ({ field, values, handleChange, model, colWidth = 6 }) => (
  <Col md={colWidth} key={field.name}>
    <FormGroup>
      <Label>{field.type !== 'boolean' ? field.label : ''}</Label>
      {!!['text', 'number'].includes(field.type) && (
        <Input
          name={field.name}
          type={field.type}
          required={field.required}
          value={values[field.name] || ''}
          onChange={handleChange}
          id={`${model}-custom-input-${field.name}`}
        />
      )}
      {!!['textarea'].includes(field.type) && (
        <Input
          name={field.name}
          type="textarea"
          rows={5}
          required={field.required}
          value={values[field.name]}
          onChange={handleChange}
          id={`${model}-custom-textarea-${field.name}`}
        />
      )}
      {!!['date-with-time', 'date'].includes(field.type) && (
        <div>
          <DatePicker
            locale="fr"
            className="form-control"
            id={`${model}-custom-datepicker-${field.name}`}
            selected={dateForDatePicker(values[field.name] ? values[field.name] : field.required ? new Date() : null)}
            onChange={(date) => handleChange({ target: { value: date, name: field.name } })}
            timeInputLabel="Heure :"
            dateFormat={`dd/MM/yyyy${field.type === 'date-with-time' ? ' HH:mm' : ''}`}
            showTimeInput={field.type === 'date-with-time'}
          />
        </div>
      )}
      {!!['boolean'].includes(field.type) && (
        <CheckboxContainer>
          <span>{field.label}</span>
          <Input
            type="checkbox"
            id={`${model}-custom-checkbox-${field.name}`}
            required={field.required}
            name={field.name}
            checked={values[field.name]}
            onChange={handleChange}
          />
        </CheckboxContainer>
      )}
      {!!['yes-no'].includes(field.type) && (
        <SelectAsInput
          options={['Oui', 'Non']}
          name={field.name}
          value={values[field.name] || ''}
          onChange={handleChange}
          inputId={`${model}-custom-select-${field.name}`}
          classNamePrefix={`${model}-custom-select-${field.name}`}
        />
      )}
      {!!['enum'].includes(field.type) && (
        <SelectAsInput
          options={field.options}
          name={field.name}
          value={values[field.name] || ''}
          onChange={handleChange}
          inputId={`${model}-custom-select-${field.name}`}
          classNamePrefix={`${model}-custom-select-${field.name}`}
        />
      )}
      {!!['multi-choice'].includes(field.type) && (
        <SelectCustom
          options={field.options}
          name={field.name}
          onChange={(v) => handleChange({ currentTarget: { value: v, name: field.name } })}
          isClearable={false}
          isMulti
          inputId={`${model}-custom-select-${field.name}`}
          classNamePrefix={`${model}-custom-select-${field.name}`}
          value={values[field.name]}
          placeholder={' -- Choisir -- '}
          getOptionValue={(i) => i}
          getOptionLabel={(i) => i}
        />
      )}
    </FormGroup>
  </Col>
);

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 20px;
  width: 80%;
`;

export default CustomFieldInput;
