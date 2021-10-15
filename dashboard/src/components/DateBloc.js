import React from 'react';
import styled from 'styled-components';

const DateBloc = ({ date }) => {
  if (!date) return <div />;
  date = new Date(date);
  return (
    <Container>
      <DayText>{date && date.toLocaleString('fr-FR', { weekday: 'long' })}</DayText>
      <DayNum>{date && date.getDate()}</DayNum>
      <MonthText>
        {date && date.toLocaleString('fr-FR', { month: 'long' })}
        {date && date.getFullYear() !== new Date().getFullYear() && `\u00A0${date.getFullYear()}`}
      </MonthText>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  /* width: 120px; */
  margin: 0;
  padding: 0;
  > span {
    width: 100px;
    display: block;
  }
`;

const MonthText = styled.span`
  text-transform: capitalize;
  text-align: center;
  font-size: 14px;
`;

const DayNum = styled.span`
  text-transform: capitalize;
  text-align: center;
  font-size: 22px;
  font-weight: 900;
`;

const DayText = styled.span`
  text-transform: capitalize;
  text-align: center;
  font-size: 14px;
`;

export default DateBloc;
