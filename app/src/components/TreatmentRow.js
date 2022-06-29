import React, { useCallback } from 'react';
import styled from 'styled-components';

import ButtonRight from './ButtonRight';
import RowContainer from './RowContainer';
import { MyText } from './MyText';
import { formatDateWithFullMonth } from '../services/dateDayjs';
import DateAndTimeCalendarDisplay from './DateAndTimeCalendarDisplay';

const showDate = (treatment) => {
  if (treatment.endDate) {
    return `Du ${formatDateWithFullMonth(treatment.startDate)}\nau ${formatDateWithFullMonth(treatment.endDate)}`;
  }
  return `À partir du\n${formatDateWithFullMonth(treatment.startDate)}`;
};

const TreatmentRow = ({ onConsultationPress, treatment, testID = 'treatment' }) => {
  const name = treatment?.name;
  const dosage = treatment?.dosage;
  const frequency = treatment?.frequency;

  const onRowPress = useCallback(() => {
    onConsultationPress(treatment);
  }, [treatment, onConsultationPress]);

  return (
    <RowContainer onPress={onRowPress} testID={`${testID}-row-${name?.split(' ').join('-').toLowerCase()}-button`}>
      <DateAndTimeCalendarDisplay date={treatment.startDate} topCaption={treatment.endDate ? 'Du' : 'À partir du'} />
      <DateAndTimeCalendarDisplay date={treatment.endDate} topCaption="au" />
      <CaptionsContainer>
        <Name bold>{name}</Name>
        <DosageContainer>
          <MyText>{dosage}</MyText>
          <MyText>{frequency}</MyText>
        </DosageContainer>
      </CaptionsContainer>
      <ButtonRight onPress={onConsultationPress} caption=">" />
    </RowContainer>
  );
};

const CaptionsContainer = styled.View`
  flex-grow: 1;
  flex-shrink: 1;
  align-items: center;
`;

const Name = styled(MyText)`
  font-weight: bold;
  font-size: 17px;
  text-align: center;
`;

const DosageContainer = styled.View`
  align-self: center;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  margin-top: 5px;
`;

export default TreatmentRow;
