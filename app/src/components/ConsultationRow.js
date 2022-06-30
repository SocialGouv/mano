import React, { useCallback } from 'react';
import styled from 'styled-components';

import ButtonRight from './ButtonRight';
import RowContainer from './RowContainer';
import { MyText } from './MyText';
import colors from '../utils/colors';

import { DONE } from '../recoil/actions';
import UserName from './UserName';
import DateAndTimeCalendarDisplay from './DateAndTimeCalendarDisplay';
import { useRecoilValue } from 'recoil';
import { userState } from '../recoil/auth';

const isVisibleByMe = (consultation, me) => {
  if (!me.healthcareProfessional) return false;
  if (!consultation?.onlyVisibleBy?.length) return true;
  return consultation.onlyVisibleBy.includes(me._id);
};

const ConsultationRow = ({ onConsultationPress, consultation, testID = 'consultation' }) => {
  const me = useRecoilValue(userState);

  const name = consultation?.name;
  const status = consultation?.status;
  const user = consultation?.user;
  const visibleByMe = isVisibleByMe(consultation, me);

  const dueAt = consultation?.dueAt ? new Date(consultation?.dueAt) : null;

  const onRowPress = useCallback(() => {
    if (!visibleByMe) return;
    onConsultationPress(consultation);
  }, [consultation, onConsultationPress, visibleByMe]);

  return (
    <RowContainer disabled={!visibleByMe} onPress={onRowPress} testID={`${testID}-row-${name?.split(' ').join('-').toLowerCase()}-button`}>
      <DateAndTimeCalendarDisplay date={dueAt} withTime />
      <CaptionsContainer>
        <Name bold>{name}</Name>
        <StatusContainer>
          <Status color={colors.app[status === DONE ? 'color' : 'secondary']}>{status}</Status>
        </StatusContainer>
        <UserContainer>{!!user && <UserName caption="Créée par" id={user?._id || user} />}</UserContainer>
      </CaptionsContainer>
      <ButtonRight onPress={onRowPress} caption=">" disabled={!visibleByMe} />
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
