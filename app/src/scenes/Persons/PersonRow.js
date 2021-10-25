import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import ButtonRight from '../../components/ButtonRight';
import { displayBirthDate } from '../../components/DateAndTimeInput';
import { MyText } from '../../components/MyText';
import RowContainer from '../../components/RowContainer';
import TeamsTags from '../../components/TeamsTags';
import colors from '../../utils/colors';

function PersonName({ person: { name, outOfActiveList, outOfActiveListReason } }) {
  if (outOfActiveList)
    return (
      <View>
        <NameMuted>{name}</NameMuted>
        <ActiveListReasonText>Sortie de file active : {outOfActiveListReason}</ActiveListReasonText>
      </View>
    );
  return <Name>{name}</Name>;
}

const PersonRow = ({ onPress, person, buttonRight = '>' }) => {
  const { outOfActiveList, birthdate, alertness } = person;

  return (
    <RowContainer onPress={onPress}>
      <CaptionsContainer>
        <PersonName person={person} />
        {birthdate && !outOfActiveList && <Birthdate>{displayBirthDate(birthdate)}</Birthdate>}
        {birthdate && outOfActiveList && <BirthdateMuted>{displayBirthDate(birthdate)}</BirthdateMuted>}
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
  margin: 0 12px;
  flex-grow: 1;
`;

const Birthdate = styled(MyText)`
  margin-top: 10px;
  color: ${colors.app.color};
`;

const BirthdateMuted = styled(Birthdate)`
  color: ${colors.app.colorGrey};
`;

const Name = styled(MyText)`
  font-weight: bold;
  font-size: 20px;
`;

const NameMuted = styled(Name)`
  color: ${colors.app.colorGrey};
`;

const ActiveListReasonText = styled(MyText)`
  font-size: 16px;
  color: ${colors.app.colorGrey};
`;

const alertSize = 35;
const AlertnessWrapper = styled.View`
  line-height: ${alertSize}px;
  height: ${alertSize}px;
  width: ${alertSize}px;
  border-radius: ${alertSize}px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
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
