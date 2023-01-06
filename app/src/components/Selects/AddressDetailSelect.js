import React from 'react';
import { useRecoilValue } from 'recoil';
import { personFieldsSelector } from '../../recoil/persons';
import SelectLabelled from './SelectLabelled';

export const isFreeFieldAddressDetail = (addressDetail, addressDetailsFields) => {
  if (!addressDetail.length) return false;
  return !addressDetailsFields.filter((o) => o !== 'Autre').includes(addressDetail);
};

const computeValue = (value, editable, addressDetailsFields) => {
  if (!value.length) return addressDetailsFields[0];
  if (!editable) return value;
  if (addressDetailsFields.includes(value)) return value;
  return 'Autre';
};

const AddressDetailSelect = ({ value = addressDetails[0], onSelect, editable }) => {
  const personFields = useRecoilValue(personFieldsSelector);
  const addressDetails = personFields.find((f) => f.name === 'addressDetail').options;

  return (
    <SelectLabelled
      label="Type d'hébergement"
      values={['-- Choisissez --', ...addressDetails]}
      value={computeValue(value, editable, addressDetails)}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default AddressDetailSelect;
