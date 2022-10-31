import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';

const IncrementorSmall = ({ service, count, onChange, disabled = false }) => {
  return (
    <IncrementorSmallWrapper className="incrementor-small">
      <p id={`${service}-title`} className="service-name">
        {service}
      </p>
      <ButtonRemoveAdd aria-label="moins" disabled={disabled || count === 0} onClick={() => onChange(count - 1)} id={`${service}-remove`}>
        -
      </ButtonRemoveAdd>
      <LocalCount
        aria-label={`Nombre de ${service}`}
        id={`${service}-count`}
        type="number"
        value={count}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
      <ButtonRemoveAdd aria-label="plus" onClick={() => onChange(count + 1)} id={`${service}-add`} disabled={disabled}>
        +
      </ButtonRemoveAdd>
    </IncrementorSmallWrapper>
  );
};

const IncrementorSmallWrapper = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
  .service-name {
    flex-grow: 1;
    color: ${theme.black75};
    margin: 0;
  }
`;
const LocalCount = styled.input`
  width: 40px;
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
