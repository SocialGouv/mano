import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useRecoilValue } from 'recoil';
import ButtonRight from './ButtonRight';
import RowContainer from './RowContainer';
import { MyText } from './MyText';
import colors from '../utils/colors';
import TeamsTags from './TeamsTags';
import { personsState } from '../recoil/persons';
import { DONE } from '../recoil/actions';

const ActionRow = ({ onActionPress, onPseudoPress, showStatus, action, withTeamName, testID = 'action' }) => {
  const persons = useRecoilValue(personsState);

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
      <DateContainer>
        {Boolean(dueAt) && (
          <>
            <Day>{dueAt.getLocaleWeekDay('fr')}</Day>
            <DateNumber heavy>{dueAt.getLocaleDay('fr')}</DateNumber>
            <Month>{dueAt.getLocaleMonth('fr')}</Month>
            {new Date().getFullYear() !== dueAt.getFullYear() && <Month>{dueAt.getFullYear()}</Month>}
            {Boolean(withTime) && <Time>{dueAt.getLocalePureTime('fr')}</Time>}
          </>
        )}
      </DateContainer>
      <CaptionsContainer>
        <Name bold>{name}</Name>
        {!!withTeamName && <TeamsTags teams={[action.team]} />}
        {showStatus ? (
          <StatusContainer onPress={onPseudoPress}>
            <Status color={colors.app[status === DONE ? 'color' : 'secondary']}>{status}</Status>
          </StatusContainer>
        ) : pseudo ? (
          <PseudoContainer onPress={onPseudoContainerPress} testID={`${testID}-row-person-${pseudo?.split(' ').join('-').toLowerCase()}-button`}>
            <Pseudo>Pour {pseudo}</Pseudo>
          </PseudoContainer>
        ) : null}
        {urgent ? <Urgent bold>❗ Action prioritaire</Urgent> : null}
      </CaptionsContainer>
      <ButtonRight onPress={onActionPress} caption=">" />
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
`;

const Pseudo = styled(MyText)`
  /* text-decoration: underline; */
  flex-grow: 0;
  align-self: flex-start;
  color: ${colors.app.color};
`;

const DateContainer = styled.View`
  flex-shrink: 0;
  flex-basis: 70px;
`;

const DateText = styled(MyText)`
  font-size: 12px;
  font-style: italic;
  text-align: center;
  text-transform: uppercase;
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

export default ActionRow;
