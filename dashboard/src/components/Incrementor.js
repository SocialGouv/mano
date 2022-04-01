import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../config';

const Incrementor = ({ service, count, onChange }) => {
  const [localcount, setLocalcount] = useState(count);

  const changeTimeout = useRef(null);

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
    <Wrapper>
      <Name id={`${service}-title`}>{service}</Name>
      <IncContainer>
        <ButtonRound type="button" onClick={() => onChangeRequest(localcount - 1)} disabled={localcount === 0} id={`${service}-remove`}>
          <span>-</span>
        </ButtonRound>
        <CardWrapper>
          <input id={`${service}-count`} type="number" value={localcount} onChange={(e) => onChangeRequest(Number(e.currentTarget.value))} />
        </CardWrapper>
        <ButtonRound type="button" onClick={() => onChangeRequest(localcount + 1)} id={`${service}-add`}>
          <span>+</span>
        </ButtonRound>
      </IncContainer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  background: ${theme.white};
  padding: 20px 0px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  margin-bottom: 10px;
  border: 1px solid ${theme.mainlight};
  min-width: 220px;
  flex-basis: 30%;
  max-width: 100%;
`;

const IncContainer = styled.div`
  /* height: 40px; */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* border-bottom: 1px solid #ccc; */
  > {
    flex-shrink: 0;
  }
`;

const Name = styled.span`
  display: block;
  flex-grow: 4;
  margin-bottom: 20px;
  max-width: 200px;
`;

const CardWrapper = styled.div`
  background: ${theme.white};
  height: 60px;
  width: 110px;
  flex-grow: 0;
  flex-shrink: 0;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-weight: bold;
  border: 1px solid ${theme.mainlight};
  overflow: hidden;
  input {
    font-size: 46px;
    font-weight: 600;
    line-height: 56px;
    color: ${theme.main};
    width: 100%;
    height: 100%;
    text-align: center;
    border: none;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    /* display: none; <- Crashes Chrome on hover */
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
  }

  input[type='number'] {
    -moz-appearance: textfield; /* Firefox */
  }
`;

const ButtonRound = styled.button`
  background-color: ${theme.main};
  color: ${theme.white};
  height: 50px;
  width: 50px;
  flex-grow: 0;
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: flex-start;
  border-radius: 50px;
  padding: 0;
  font-weight: 800;
  font-size: 40px;
  border: none;
  margin: 0 5px;
  ${(props) => props.disabled && 'opacity: 0.5;'}
  span {
    display: inline-flex;
    height: 45px;
    width: 50px;
    justify-content: center;
    align-items: center;
  }
`;

export default Incrementor;
