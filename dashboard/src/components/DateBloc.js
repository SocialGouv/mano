import React from "react";
import styled from "styled-components";

const ShowDate = ({ date }) => {
  if (!date) return <div />;
  const d = new Date(date);
  const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0, 0));
  return (
    <Container>
      <DayText>{date && utcDate.toLocaleString("fr-FR", { weekday: "long" })}</DayText>
      <DayNum>{date && utcDate.getDate()}</DayNum>
      <MonthText>
        {date && utcDate.toLocaleString("fr-FR", { month: "long" })}
        {date && utcDate.getFullYear() !== new Date().getFullYear() && `\u00A0${utcDate.getFullYear()}`}
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

export default ShowDate;
