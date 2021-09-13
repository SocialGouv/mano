import React from 'react';
import styled from 'styled-components';
import ButtonRight from '../../components/ButtonRight';
import { displayBirthDate } from '../../components/DateAndTimeInput';
import { MyText } from '../../components/MyText';
import RowContainer from '../../components/RowContainer';
import TeamsTags from '../../components/TeamsTags';
import colors from '../../utils/colors';

const PersonRow = ({ onPress, person, buttonRight = '>' }) => {
  const { name, birthdate, alertness } = person;

  return (
    <RowContainer onPress={onPress}>
      <CaptionsContainer>
        <Name>{name}</Name>
        {birthdate && <Birthdate>{displayBirthDate(birthdate)}</Birthdate>}
        <TeamsTags teams={person.assignedTeams} />
      </CaptionsContainer>
      {!!alertness && (
        <AlertnessWrapper>
          <AlertnessIndicator>!</AlertnessIndicator>
        </AlertnessWrapper>
      )}
      <ButtonRight onPress={onPress} caption={buttonRight} />
    </RowContainer>
  );
};

const CaptionsContainer = styled.View`
  margin-horizontal: 12px;
  flex-grow: 1;
`;

const Birthdate = styled(MyText)`
  margin-top: 10px;
  color: ${colors.app.color};
`;

const Name = styled(MyText)`
  font-weight: bold;
  font-size: 20px;
`;

const alertSize = 35;
const AlertnessWrapper = styled.View`
  line-height: ${alertSize}px;
  height: ${alertSize}px;
  width: ${alertSize}px;
  border-radius: ${alertSize}px;
  align-items: center;
  justify-content: center;
  padding-horizontal: 10px;
  /* flex-grow: 1; */
  /* border: 2px solid ${colors.app.secondary}; */
`;
const AlertnessIndicator = styled(MyText)`
  font-weight: bold;
  font-size: ${alertSize * 0.75}px;
  line-height: ${alertSize}px;
  align-items: center;
  justify-content: center;
  text-align: right;
  color: ${colors.app.secondary};
`;

export default PersonRow;
