import React, { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import styled from 'styled-components';
import { theme } from '../config';
import API from '../services/api';

const IncrementorSmall = ({ service, team, date, count: initialValue, onUpdated, dataTestId, disabled = false }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => setValue(initialValue), [initialValue]);

  useDebounce(
    function updateServiceInDatabase() {
      if (value === initialValue || disabled) return;
      API.post({ path: `/service/team/${team}/date/${date}`, body: { count: value, service } }).then((res) => {
        if (res.ok) onUpdated(res.data.count);
      });
    },
    process.env.REACT_APP_TEST === 'true' ? 0 : 1000,
    [value]
  );
  return (
    <IncrementorSmallWrapper className="incrementor-small">
      <p id={`${service}-title`} className="service-name">
        {service}
      </p>
      <ButtonRemoveAdd aria-label="moins" disabled={disabled || value === 0} onClick={() => setValue(value - 1)} id={`${service}-remove`}>
        -
      </ButtonRemoveAdd>
      <LocalCount
        aria-label={`Nombre de ${service}`}
        min="0"
        id={`${service}-count`}
        data-test-id={dataTestId || `${service}-count`}
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(Number(e.currentTarget.value))}
      />
      <ButtonRemoveAdd aria-label="plus" onClick={() => setValue(value + 1)} id={`${service}-add`} disabled={disabled}>
        +
      </ButtonRemoveAdd>
    </IncrementorSmallWrapper>
  );
};

const IncrementorSmallWrapper = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 10px;
  .service-name {
    flex-grow: 1;
    color: ${theme.black75};
    margin: 0;
  }
`;
const LocalCount = styled.input`
  width: 48px;
  text-align: center;
  color: ${theme.black75};
  background: none;
  border: none;
`;

const ButtonRemoveAdd = styled.button`
  background: none;
  border: 1px solid ${theme.main};
  width: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: ${theme.main};
  border-radius: 20%;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: auto;
  &:hover {
    background: ${theme.main};
    color: ${theme.white};
  }
  &:disabled {
    background: none;
    border: 1px solid #ccc;
    color: #ccc;
    cursor: not-allowed;
  }
`;

export default IncrementorSmall;
