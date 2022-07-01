import React from 'react';
import styled from 'styled-components';

import { MyText } from './MyText';
import colors from '../utils/colors';

const DateAndTimeCalendarDisplay = ({ date, withTime, topCaption }) => {
  date = date ? new Date(date) : null;

  return (
    <DateContainer>
      {Boolean(date) && (
        <>
          {topCaption && <TopCaption>{topCaption}</TopCaption>}
          <Day>{date.getLocaleWeekDay('fr')}</Day>
          <DateNumber heavy>{date.getLocaleDay('fr')}</DateNumber>
          <Month>{date.getLocaleMonth('fr')}</Month>
          {new Date().getFullYear() !== date.getFullYear() && <Month>{date.getFullYear()}</Month>}
          {!!withTime && <Time>{date.getLocalePureTime('fr')}</Time>}
        </>
      )}
    </DateContainer>
  );
};

const DateContainer = styled.View`
  flex-shrink: 0;
  flex-basis: 70px;
  /* border: 2px solid black; */
`;

const DateText = styled(MyText)`
  font-size: 12px;
  font-style: italic;
  text-align: center;
  text-transform: uppercase;
`;

const TopCaption = styled(MyText)`
  font-size: 12px;
  font-style: italic;
  text-align: center;
  margin-top: -15px;
  margin-bottom: 5px;
  opacity: 0.25;
`;

const Day = styled(DateText)`
  color: ${colors.app.color};
`;

const Time = styled(DateText)`
  margin-top: 10px;
`;

const Month = styled(DateText)`
  color: ${colors.app.secondary};
`;

const DateNumber = styled(MyText)`
  font-size: 20px;
  font-style: italic;
  text-align: center;
  margin-vertical: 5px;
`;

export default DateAndTimeCalendarDisplay;
