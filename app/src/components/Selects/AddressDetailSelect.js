import React from 'react';
import { addressDetailsFixedFields } from '../../contexts/persons';
import SelectLabelled from './SelectLabelled';

const addressDetailsFields = ['-- Choisissez --', ...addressDetailsFixedFields];

export const addressDetails = [...addressDetailsFields, 'Autre'];

export const isFreeFieldAddressDetail = (addressDetail) => {
  if (!addressDetail.length) return false;
  return !addressDetailsFields.includes(addressDetail);
};

const computeValue = (value, editable) => {
  if (!value.length) return addressDetails[0];
  if (!editable) return value;
  if (addressDetailsFields.includes(value)) return value;
  return 'Autre';
};

const AddressDetailSelect = ({ value = addressDetails[0], onSelect, editable }) => {
  return (
    <SelectLabelled
      label="Type d'hébergement"
      values={addressDetails}
      value={computeValue(value, editable)}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default AddressDetailSelect;
