import React from 'react';
import styled from 'styled-components';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { MyText } from '../../components/MyText';
import colors from '../../utils/colors';
import UserName from '../../components/UserName';
import API from '../../services/api';
import { userState } from '../../recoil/auth';
import { customFieldsObsSelector, territoryObservationsState } from '../../recoil/territoryObservations';

const hitSlop = {
  top: 20,
  left: 20,
  right: 20,
  bottom: 20,
};

const fieldIsEmpty = (value) => {
  if (value === null) return true;
  if (value === undefined) return true;
  if (typeof value === 'string' && !value.length) return true;
  if (Array.isArray(value) && !value.length) return true;
  return false;
};

const showBoolean = (value) => {
  if (value === null) return '';
  if (value === undefined) return '';
  if (!value) return 'Non';
  return 'Oui';
};

const computeCustomFieldDisplay = (field, value) => {
  if (['text', 'number'].includes(field.type)) return value;
  if (['textarea'].includes(field.type)) return value?.split('\\n')?.join('\u000A');
  if (!!['date-with-time'].includes(field.type) && !!value) {
    return new Date(value).getLocaleDateAndTime('fr');
  }
  if (!!['date'].includes(field.type) && !!value) {
    return new Date(value).getLocaleDate('fr');
  }
  if (['boolean'].includes(field.type)) return showBoolean(value);
  if (['yes-no'].includes(field.type)) return value;
  if (['enum'].includes(field.type)) return value;
  if (['multi-choice'].includes(field.type)) return value?.join(', ');
  return JSON.stringify(value);
};

const TerritoryObservationRow = ({ onUpdate, observation, showActionSheetWithOptions, id }) => {
  const user = useRecoilValue(userState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const setTerritoryObservations = useSetRecoilState(territoryObservationsState);

  const onPressRequest = async () => {
    const options = ['Supprimer', 'Annuler'];
    if (onUpdate && observation.user._id === user._id) options.unshift('Modifier');
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') onUpdate(observation);
        if (options[buttonIndex] === 'Supprimer') onObservationDeleteRequest();
      }
    );
  };

  const onObservationDeleteRequest = () => {
    Alert.alert('Voulez-vous supprimer cette observation ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => onObservationDelete(),
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onObservationDelete = async () => {
    const response = await API.delete({ path: `/territory-observation/${observation._id}` });
    if (response.error) return Alert.alert(response.error);
    if (response.ok) {
      setTerritoryObservations((territoryObservations) =>
        territoryObservations.filter((p) => {
          return p._id !== observation._id;
        })
      );
    }
  };

  const { createdAt } = observation;

  return (
    <Container>
      <CaptionsContainer>
        {customFieldsObs
          .filter((f) => f.enabled)
          .map((field) => {
            const { name, label } = field;
            return (
              <CommentStyled key={name} fieldIsEmpty={fieldIsEmpty(observation[name])}>
                {label}: {computeCustomFieldDisplay(field, observation[name])}
              </CommentStyled>
            );
          })}
        <CreationDate>
          {!!observation?.user && <UserName caption="Observation faite par" id={observation.user?._id || observation.user} />}
          {'\u000A'}
          {new Date(createdAt).getLocaleDateAndTime('fr')}
        </CreationDate>
      </CaptionsContainer>
      <OnMoreContainer hitSlop={hitSlop} onPress={onPressRequest}>
        <Dot />
        <Dot />
        <Dot />
      </OnMoreContainer>
    </Container>
  );
};

const Container = styled.View`
  background-color: #f4f5f8;
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  margin-horizontal: 30px;
  margin-vertical: 8px;
`;

const CaptionsContainer = styled.View`
  padding-top: 25px;
  padding-bottom: 5px;
  padding-horizontal: 15px;
  flex-grow: 1;
  /* flex-basis: 100%; */
  align-items: flex-start;
`;

const CommentStyled = styled(MyText)`
  font-size: 17px;
  margin-bottom: 10px;
  color: rgba(30, 36, 55, 0.75);
  ${(props) => props.fieldIsEmpty && 'opacity: 0.25;'}
`;

const CreationDate = styled(MyText)`
  font-style: italic;
  margin-left: auto;
  margin-top: 10px;
  margin-bottom: 10px;
  margin-right: 25px;
  color: ${colors.app.color};
  text-align: right;
`;

const OnMoreContainer = styled.TouchableOpacity`
  flex-direction: row;
  position: absolute;
  top: 16px;
  right: 8px;
`;

const Dot = styled.View`
  width: 3px;
  height: 3px;
  border-radius: 3px;
  background-color: rgba(30, 36, 55, 0.5);
  margin-right: 3px;
`;

export default connectActionSheet(TerritoryObservationRow);
