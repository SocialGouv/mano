import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { View } from 'react-native';
import { useRecoilValue } from 'recoil';
import ButtonRight from './ButtonRight';
import RowContainer from './RowContainer';
import { MyText } from './MyText';
import colors from '../utils/colors';
import TeamsTags from './TeamsTags';
import { personsState } from '../recoil/persons';
import { DONE } from '../recoil/actions';
import DateAndTimeCalendarDisplay from './DateAndTimeCalendarDisplay';
import { organisationState } from '../recoil/auth';

const ActionRow = ({ onActionPress, onPseudoPress, showStatus, action, withTeamName, testID = 'action' }) => {
  const persons = useRecoilValue(personsState);
  const organisation = useRecoilValue(organisationState);

  const name = action?.name;
  const status = action?.status;
  const withTime = action?.withTime;
  const urgent = action?.urgent;
  const person = useMemo(() => (action?.person ? persons?.find((p) => p._id === action.person) : null), [persons, action.person]);
  const pseudo = useMemo(() => action?.personName || person?.name, [action, person?.name]);
  const dueAt = action?.dueAt ? new Date(action?.dueAt) : null;

  const onPseudoContainerPress = useCallback(() => {
    onPseudoPress(person);
  }, [person, onPseudoPress]);

  const onRowPress = useCallback(() => {
    onActionPress(action);
  }, [action, onActionPress]);

  return (
    <RowContainer onPress={onRowPress} testID={`${testID}-row-${name?.split(' ').join('-').toLowerCase()}-button`}>
      <DateAndTimeCalendarDisplay date={dueAt} withTime={withTime} />
      <CaptionsContainer>
        <View className="flex-row items-center">
          {!!organisation.groupsEnabled && !!action.group && (
            <View className="mr-2">
              <MyText>👪</MyText>
            </View>
          )}
          <Name bold>{name}</Name>
        </View>
        {!!withTeamName && <TeamsTags teams={[action.team]} />}
        {showStatus ? (
          <StatusContainer>
            <Status color={colors.app[status === DONE ? 'color' : 'secondary']}>{status}</Status>
          </StatusContainer>
        ) : pseudo ? (
          <PseudoContainer onPress={onPseudoContainerPress} testID={`${testID}-row-person-${pseudo?.split(' ').join('-').toLowerCase()}-button`}>
            <Pseudo>Pour {pseudo}</Pseudo>
          </PseudoContainer>
        ) : null}
        {urgent ? <Urgent bold>❗ Action prioritaire</Urgent> : null}
      </CaptionsContainer>
      <ButtonRight onPress={onRowPress} caption=">" />
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

const Urgent = styled(MyText)`
  font-weight: bold;
  font-size: 17px;
  margin-top: 10px;
  color: red;
`;

const StatusContainer = styled.View`
  margin-top: 15px;
  align-self: flex-start;
`;

const Status = styled(MyText)`
  /* text-decoration: underline; */
  flex-grow: 0;
  align-self: flex-start;
  color: ${(props) => props.color};
`;

const PseudoContainer = styled.TouchableOpacity`
  margin-top: 15px;
  align-self: flex-start;
  flex-direction: row;
`;

const Pseudo = styled(MyText)`
  /* text-decoration: underline; */
  flex-grow: 0;
  align-self: flex-start;
  color: ${colors.app.color};
`;

export default ActionRow;
