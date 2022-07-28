import React from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/fr';

dayjs.extend(utc);
dayjs.locale('fr');

const DateBloc = ({ date }) => {
  if (!date) return <div />;
  date = dayjs(date);
  return (
    <Container>
      <DayText>{date && date.format('dddd')}</DayText>
      <DayNum>{date && date.format('D')}</DayNum>
      <MonthText>
        {date && date.format('MMMM')}
        {date && date.format('YYYY') !== dayjs.utc().format('YYYY') && ` ${date.format('YYYY')}`}
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
