import React from 'react';
import styled from 'styled-components';
import ButtonRight from '../../components/ButtonRight';
import RowContainer from '../../components/RowContainer';
import { isToday, isTomorrow, isComingInDays, isPassed } from '../../services/date';

export const getActionBadge =
  (now = Date.now()) =>
  ({ status, dueAt, completedAt }) => {
    if (status === 'FAIT') return 'white';
    return '#2d66fb';
    if (!dueAt && status === 'A FAIRE') return 'red';
    if (!dueAt) return 'white';
    if (isPassed(dueAt, now)) return 'red';
    if (isToday(dueAt, now)) return 'rgba(31, 138, 0, 0.75)';
    if (isTomorrow(dueAt, now)) return 'rgba(254, 177, 0, 0.75)';
    if (isComingInDays(dueAt, 3, now)) return 'yellow';
    return 'rgba(0, 0, 255, 0.25)';
  };

const ActionRow = ({ onActionPress, onPseudoPress, name, pseudo, status, dueAt, completedAt }) => {
  return (
    <RowContainer noPadding onPress={onActionPress}>
      <Badge dueAt={dueAt} completedAt={completedAt} status={status} />
      <DateContainer>
        {Boolean(dueAt) && (
          <>
            <DateText>{new Date(dueAt).getLocaleWeekDay('fr')}</DateText>
            <DateNumber>{new Date(dueAt).getLocaleDay('fr')}</DateNumber>
            <DateText>{new Date(dueAt).getLocaleMonth('fr')}</DateText>
          </>
        )}
      </DateContainer>
      <CaptionsContainer>
        <Status>{status}</Status>
        <Name>{name}</Name>
        {pseudo && (
          <PseudoContainer onPress={onPseudoPress}>
            <Pseudo>Pour {pseudo}</Pseudo>
          </PseudoContainer>
        )}
      </CaptionsContainer>
      <ButtonRight onPress={onActionPress} caption=">" />
    </RowContainer>
  );
};

const Badge = styled.View`
  flex-shrink: 0;
  width: 5px;
  height: 100%;
  background-color: ${getActionBadge()};
`;

const CaptionsContainer = styled.View`
  padding-vertical: 15px;
  margin-horizontal: 15px;
  flex-grow: 1;
  flex-shrink: 1;
`;

const Name = styled.Text`
  font-weight: bold;
`;

const Status = styled.Text`
  text-transform: uppercase;
  margin-bottom: 15px;
`;

const PseudoContainer = styled.TouchableOpacity`
  margin-top: 15px;
  align-self: flex-start;
`;

const Pseudo = styled.Text`
  /* text-decoration: underline; */
  flex-grow: 0;
  align-self: flex-start;
`;

const DateContainer = styled.View`
  margin-right: 20px;
  margin-left: 5px;
  flex-shrink: 0;
  flex-basis: 70px;
`;

const DateText = styled.Text`
  font-size: 14px;
  font-style: italic;
  text-align: center;
`;

const DateNumber = styled.Text`
  font-size: 30px;
  font-style: italic;
  text-align: center;
`;

export default ActionRow;
