import React, { useCallback, useMemo } from 'react';
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
import { StyleSheet } from 'react-native';
import { personsState } from '../recoil/persons';
import { disableConsultationRow } from '../recoil/consultations';

const isVisibleByMe = (consultation, me) => {
  if (!me?.healthcareProfessional) return false;
  if (!consultation?.onlyVisibleBy?.length) return true;
  return consultation.onlyVisibleBy.includes(me._id);
};

const ConsultationRow = ({
  onConsultationPress,
  consultation,
  testID = 'consultation',
  withBadge = false,
  showStatus,
  showPseudo,
  onPseudoPress,
}) => {
  const persons = useRecoilValue(personsState);
  const me = useRecoilValue(userState);

  const name = disableConsultationRow(consultation, me) ? '' : consultation.name || `Consultation ${consultation.type}`;
  const type = disableConsultationRow(consultation, me) ? '' : consultation.type;
  const status = consultation.status;
  const user = consultation.user;
  const person = useMemo(() => (consultation?.person ? persons?.find((p) => p._id === consultation.person) : null), [persons, consultation.person]);
  const pseudo = useMemo(() => consultation?.personName || person?.name, [consultation, person?.name]);
  const visibleByMe = isVisibleByMe(consultation, me);

  const dueAt = consultation?.dueAt ? new Date(consultation?.dueAt) : null;

  const onRowPress = useCallback(() => {
    if (!visibleByMe) return;
    onConsultationPress(consultation, person);
  }, [consultation, onConsultationPress, visibleByMe, person]);

  const onPseudoContainerPress = useCallback(() => {
    if (onPseudoPress) onPseudoPress(person);
  }, [person, onPseudoPress]);

  return (
    <RowContainer
      styles={styles}
      disabled={!visibleByMe}
      onPress={onRowPress}
      testID={`${testID}-row-${name?.split(' ').join('-').toLowerCase()}-button`}>
      {!!withBadge && (
        <ConsultationBadge>
          <MyText>🩺</MyText>
        </ConsultationBadge>
      )}
      <DateAndTimeCalendarDisplay date={dueAt} withTime />
      <CaptionsContainer>
        <Name>{name}</Name>
        <Type>{type}</Type>
        {showStatus ? (
          <>
            <StatusContainer>
              <Status color={colors.app[status === DONE ? 'color' : 'secondary']}>{status}</Status>
            </StatusContainer>
          </>
        ) : showPseudo && pseudo ? (
          <PseudoContainer onPress={onPseudoContainerPress} testID={`${testID}-row-person-${pseudo?.split(' ').join('-').toLowerCase()}-button`}>
            <Pseudo>Pour {pseudo}</Pseudo>
          </PseudoContainer>
        ) : null}
        <UserContainer>{!!user && <UserName caption="Créée par" id={user?._id || user} />}</UserContainer>
      </CaptionsContainer>
      <ButtonRight onPress={onRowPress} caption=">" disabled={!visibleByMe} />
    </RowContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    // borderWidth: 2,
    // borderColor: '#0a69da',
    backgroundColor: '#ddf4ff',
  },
  subContainer: {},
});

const CaptionsContainer = styled.View`
  margin-horizontal: 15px;
  flex-grow: 1;
  flex-shrink: 1;
`;

const Name = styled(MyText)`
  font-weight: bold;
  font-size: 17px;
`;

const Type = styled(MyText)`
  font-size: 12px;
  opacity: 0.5;
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

const ConsultationBadge = styled.View`
  position: absolute;
  top: 3px;
  left: 3px;

  background-color: #fef2f2;
  width: 30px;
  height: 30px;
  border-radius: 30px;
  font-size: 15px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #0a69da;
`;

const PseudoContainer = styled.TouchableOpacity`
  margin-top: 15px;
  align-self: flex-start;
`;

const Pseudo = styled(MyText)`
  /* text-decoration: underline; */
  flex-grow: 0;
  align-self: flex-start;
  color: ${colors.app.color};
`;
export default ConsultationRow;
