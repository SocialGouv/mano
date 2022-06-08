import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../config';

const Card = ({ title, count, unit, children, onChange, countId }) => {
  const [localcount, setLocalcount] = useState(count);

  const changeTimeout = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalcount(count);
  }, [count]);

  const onChangeRequest = async (newCount) => {
    newCount = Number(parseInt(newCount, 10).toString());
    setLocalcount(newCount);
    clearTimeout(changeTimeout.current);
    changeTimeout.current = setTimeout(() => onChange(newCount), 1000);
  };

  return (
    <CardWrapper>
      {!!title && <CardTitle dangerouslySetInnerHTML={{ __html: title }} />}
      <CardCount withChildren={!!children}>
        {!!onChange ? (
          <InputStyled
            id={countId}
            type="number"
            ref={inputRef}
            value={localcount}
            onChange={(e) => onChangeRequest(Number(e.currentTarget.value))}
          />
        ) : (
          <span id={countId}>{count}</span>
        )}
        {!!unit && <Unit>{unit}</Unit>}
      </CardCount>
      {children}
    </CardWrapper>
  );
};

const CardWrapper = styled.div`
  background: ${theme.white};
  padding: 24px 0 40px;
  border-radius: 20px;
  display: flex;
  height: 100%;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  font-weight: bold;
  margin-bottom: 10px;
  border: 1px solid ${theme.main25};
  width: 100%;
`;

const CardTitle = styled.div`
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  color: ${theme.black};
`;

const fontSize = 56;
const CardCount = styled.div`
  font-size: ${fontSize}px;
  line-height: ${fontSize}px;
  color: ${theme.main};
  display: flex;
  align-items: flex-end;
  ${(props) => props.withChildren && 'margin-bottom: 15px;'}
`;

const InputStyled = styled.input`
  border: none;
  display: block;
  width: ${(props) => (`${props.value}`.length * fontSize * 2) / 3}px;
  font-weight: 600;
  line-height: 56px;
  color: ${theme.main};
  height: 100%;
  text-align: center;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    /* display: none; <- Crashes Chrome on hover */
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
  }

  &[type='number'] {
    -moz-appearance: textfield; /* Firefox */
  }
`;

const Unit = styled.span`
  font-size: 15px;
  margin-left: 10px;
  line-height: 25px;
`;

export default Card;
