import React from 'react';
import { Text, View } from 'react-native';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import ButtonTopPlus from '../../components/ButtonTopPlus';
import { displayBirthDate } from '../../components/DateAndTimeInput';
import { MyText } from '../../components/MyText';
import RowContainer from '../../components/RowContainer';
import TeamsTags from '../../components/TeamsTags';
import colors from '../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import ButtonRight from '../../components/ButtonRight';

const PersonName = ({ person: { name, outOfActiveList, outOfActiveListReason } }) => {
  if (outOfActiveList) {
    return (
      <OutOfActiveListContainer>
        <NameMuted>{name}</NameMuted>
        <ActiveListReasonText>Sortie de file active : {outOfActiveListReason}</ActiveListReasonText>
      </OutOfActiveListContainer>
    );
  }
  return <Name>{name}</Name>;
};

const PersonRow = ({ onPress, person, isPersonsSearchRow = false, showActionSheetWithOptions }) => {
  const { outOfActiveList, birthdate, alertness } = person;
  const navigation = useNavigation();

  const onMorePress = async () => {
    const options = ['Ajouter une rencontre', 'Ajouter une action', 'Ajouter un commentaire', 'Ajouter un lieu fréquenté', 'Annuler'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      async (buttonIndex) => {
        Sentry.setContext('person', { _id: person._id });
        if (options[buttonIndex] === 'Ajouter une rencontre') {
          navigation.push('AddRencontre', { person, fromRoute: 'PersonsList' });
        }
        if (options[buttonIndex] === 'Ajouter une action') {
          navigation.push('NewActionForm', { person, fromRoute: 'PersonsList' });
        }
        if (options[buttonIndex] === 'Ajouter un commentaire') {
          navigation.push('PersonComment', { person, fromRoute: 'PersonsList' });
        }
        if (options[buttonIndex] === 'Ajouter un lieu fréquenté') {
          navigation.push('NewPersonPlaceForm', { person, fromRoute: 'PersonsList' });
        }
      }
    );
  };

  return (
    <RowContainer onPress={onPress}>
      <CaptionsContainer>
        <CaptionsFirstLine>
          {Boolean(alertness) && (
            <ExclamationMarkButtonDiv>
              <Text>!</Text>
            </ExclamationMarkButtonDiv>
          )}
          <PersonName person={person} />
          {!isPersonsSearchRow && <ButtonTopPlus onPress={onMorePress} />}
        </CaptionsFirstLine>
        {birthdate && !outOfActiveList && <Birthdate>{displayBirthDate(birthdate)}</Birthdate>}
        {birthdate && outOfActiveList && <BirthdateMuted>{displayBirthDate(birthdate)}</BirthdateMuted>}
        <TeamsTags teams={person.assignedTeams} />
      </CaptionsContainer>
      {isPersonsSearchRow && <ButtonRight onPress={onPress} caption="+" />}
    </RowContainer>
  );
};

const OutOfActiveListContainer = styled.View`
  flex-grow: 1;
`;

const CaptionsContainer = styled.View`
  margin: 0 12px;
  flex-grow: 1;
`;

const CaptionsFirstLine = styled.View`
  flex-direction: row;
  width: 100%;
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
  flex-grow: 1;
`;

const NameMuted = styled(Name)`
  color: ${colors.app.colorGrey};
`;

const ActiveListReasonText = styled(MyText)`
  font-size: 16px;
  color: ${colors.app.colorGrey};
`;

const ExclamationMarkButtonDiv = styled.View`
  width: 20px;
  height: 20px;
  border-radius: 20px;
  margin-right: 10px;
  box-shadow: none;
  border: 2px solid #dc2626;
  color: #dc2626;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fef2f2;
  flex-shrink: 0;
`;

export default connectActionSheet(PersonRow);
