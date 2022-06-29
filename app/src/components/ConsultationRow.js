import React, { useCallback } from 'react';
import styled from 'styled-components';

import ButtonRight from './ButtonRight';
import RowContainer from './RowContainer';
import { MyText } from './MyText';
import colors from '../utils/colors';

import { DONE } from '../recoil/actions';
import UserName from './UserName';
import DateAndTimeCalendarDisplay from './DateAndTimeCalendarDisplay';

const ConsultationRow = ({ onConsultationPress, consultation, testID = 'consultation' }) => {
  const name = consultation?.name;
  const status = consultation?.status;
  const user = consultation?.user;
  const dueAt = consultation?.dueAt ? new Date(consultation?.dueAt) : null;

  const onRowPress = useCallback(() => {
    onConsultationPress(consultation);
  }, [consultation, onConsultationPress]);

  return (
    <RowContainer onPress={onRowPress} testID={`${testID}-row-${name?.split(' ').join('-').toLowerCase()}-button`}>
      <DateAndTimeCalendarDisplay date={dueAt} withTime />
      <CaptionsContainer>
        <Name bold>{name}</Name>
        <StatusContainer>
          <Status color={colors.app[status === DONE ? 'color' : 'secondary']}>{status}</Status>
        </StatusContainer>
        <UserContainer>{!!user && <UserName caption="Créée par" id={user?._id || user} />}</UserContainer>
      </CaptionsContainer>
      <ButtonRight onPress={onConsultationPress} caption=">" />
    </RowContainer>
  );
};

const CaptionsContainer = styled.View`
  margin-horizontal: 15px;
  flex-grow: 1;
  flex-shrink: 1;
`;

const Name = styled(MyText)`
  font-weight: bold;
  font-size: 17px;
`;

const StatusContainer = styled.View`
  margin-top: 15px;
  align-self: flex-start;
`;

const UserContainer = styled.View`
  margin-top: 15px;
  margin-bottom: -20px;
  align-self: flex-start;
`;

const Status = styled(MyText)`
  /* text-decoration: underline; */
  flex-grow: 0;
  align-self: flex-start;
  color: ${(props) => props.color};
`;

export default ConsultationRow;
