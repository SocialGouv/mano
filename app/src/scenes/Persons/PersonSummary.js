import React from 'react';
import { Alert, findNodeHandle, Linking, Text, View } from 'react-native';
import styled from 'styled-components';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import * as Sentry from '@sentry/react-native';
import ScrollContainer from '../../components/ScrollContainer';
import Button from '../../components/Button';
import InputLabelled from '../../components/InputLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import ActionRow from '../Actions/ActionRow';
import CommentRow from '../Comments/CommentRow';
import SubList from '../../components/SubList';
import Spinner from '../../components/Spinner';
import ButtonDelete from '../../components/ButtonDelete';
import DateAndTimeInput, { displayBirthDate } from '../../components/DateAndTimeInput';
import GenderSelect from '../../components/Selects/GenderSelect';
import Spacer from '../../components/Spacer';
import NewCommentInput from '../Comments/NewCommentInput';
import { compose } from 'recompose';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import TeamsMultiCheckBoxes from '../../components/MultiCheckBoxes/TeamsMultiCheckBoxes';
import AuthContext from '../../contexts/auth';
import ActionsContext from '../../contexts/actions';
import PlacesContext from '../../contexts/places';
import withContext from '../../contexts/withContext';
import colors from '../../utils/colors';
import PhoneIcon from '../../icons/PhoneIcon';
import RelsPersonPlaceContext from '../../contexts/relPersonPlace';

class PersonSummary extends React.Component {
  onAddPlaceRequest = () => {
    const { navigation, person } = this.props;
    navigation.push('NewPersonPlaceForm', { person, fromRoute: 'Person' });
  };

  onPlaceMore = async (rel) => {
    const { showActionSheetWithOptions, context, navigation, person } = this.props;
    const options = ['Modifier', 'Retirer', 'Annuler'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') {
          navigation.navigate('PersonPlace', {
            _id: rel.place,
            personName: person.name,
            fromRoute: 'Person',
          });
        }
        if (options[buttonIndex] === 'Retirer') {
          const response = await context.deleteRelation(rel._id);
          if (!response.ok) return Alert.alert(response.error);
        }
      }
    );
  };

  onCommentUpdate = (comment) => {
    const { navigation, person } = this.props;
    navigation.navigate('PersonComment', {
      ...comment,
      name: person.name,
      fromRoute: 'Person',
    });
  };

  onAddActionRequest = () => {
    const { navigation, person } = this.props;
    navigation.push('Actions', {
      screen: 'NewActionForm',
      params: { person: person._id, fromRoute: 'Person' },
    });
  };

  _scrollToInput = (ref) => {
    if (!ref) return;
    setTimeout(() => {
      ref.measureLayout(
        findNodeHandle(this.scrollView),
        (x, y, width, height) => {
          this.scrollView.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  onRemoveFromActiveList = async () => {
    const { navigation, person } = this.props;
    navigation.push('Persons', {
      screen: 'PersonsOutOfActiveListReason',
      params: { person, fromRoute: 'Person' },
    });
  };

  onGetBackToActiveList = async () => {
    const { navigation, person } = this.props;
    await this.props.context.updatePerson({ ...person, outOfActiveListReason: '', outOfActiveList: false });
    navigation.replace('Persons', {
      screen: 'Person',
      params: { ...person },
    });
  };

  render() {
    const {
      loading,
      updating,
      editable,
      navigation,
      onChange,
      onUpdatePerson,
      onEdit,
      isUpdateDisabled,
      onDeleteRequest,
      context,
      route,
      phone,
      backgroundColor,
      ...person
    } = this.props;
    const { actions, places, relsPersonPlace, comments } = context;

    return (
      <>
        {loading ? (
          <Spinner />
        ) : (
          <ScrollContainer ref={(r) => (this.scrollView = r)} backgroundColor={backgroundColor || colors.app.color}>
            {person.outOfActiveList && (
              <AlterOutOfActiveList>
                <Text style={{ color: colors.app.colorWhite }}>
                  {person?.name} est en dehors de la file active, pour le motif suivant : {person.outOfActiveListReason}
                </Text>
              </AlterOutOfActiveList>
            )}
            <InputLabelled
              label="Nom prénom ou Pseudonyme"
              onChangeText={(name) => onChange({ name })}
              value={person.name}
              placeholder="Monsieur X"
              editable={editable}
            />
            <InputLabelled
              label="Autres pseudos"
              onChangeText={(otherNames) => onChange({ otherNames })}
              value={person.otherNames}
              placeholder="Mister X, ..."
              editable={editable}
            />
            <GenderSelect onSelect={(gender) => onChange({ gender })} value={person.gender} editable={editable} />
            {editable ? (
              <DateAndTimeInput
                label="Date de naissance"
                setDate={(birthdate) => onChange({ birthdate })}
                date={person.birthdate}
                editable={editable}
                showYear
              />
            ) : (
              <InputLabelled label="Âge" value={displayBirthDate(person.birthdate, { reverse: true })} placeholder="JJ-MM-AAAA" editable={false} />
            )}
            {editable ? (
              <DateAndTimeInput
                label="Suivi(e) depuis / Créé(e) le"
                setDate={(createdAt) => onChange({ createdAt })}
                date={person.createdAt}
                editable={editable}
                showYear
              />
            ) : (
              <InputLabelled
                label="Suivi(e) depuis / Créé(e) le"
                value={displayBirthDate(person.createdAt, {
                  reverse: true,
                  roundHalf: true,
                })}
                placeholder="JJ-MM-AAAA"
                editable={false}
              />
            )}
            {editable ? (
              <DateAndTimeInput
                label="En rue depuis le"
                setDate={(wanderingAt) => onChange({ wanderingAt })}
                date={person.wanderingAt}
                editable={editable}
                showYear
              />
            ) : (
              <InputLabelled
                label="En rue depuis le"
                value={displayBirthDate(person.wanderingAt, { reverse: true, roundHalf: true })}
                placeholder="JJ-MM-AAAA"
                editable={false}
              />
            )}
            <Row>
              <InputLabelled
                label="Téléphone"
                onChangeText={(phone) => onChange({ phone })}
                value={phone}
                placeholder="06 12 52 32 13"
                textContentType="telephoneNumber"
                keyboardType="phone-pad"
                autoCorrect={false}
                editable={editable}
                noMargin={editable || phone?.length}
              />
              <Spacer />
              {!!phone.length && (
                <Button
                  caption="Appeler"
                  Icon={PhoneIcon}
                  color={colors.app.secondary}
                  onPress={() => Linking.openURL('tel:' + phone?.split(' ').join(''))}
                  noBorder
                />
              )}
            </Row>
            <InputLabelled
              label="Description"
              onChangeText={(description) => onChange({ description })}
              value={person.description}
              placeholder="Description"
              multiline
              editable={editable}
              ref={(r) => (this.descriptionRef = r)}
              onFocus={() => this._scrollToInput(this.descriptionRef)}
            />
            <CheckboxLabelled
              label="Personne vulnérable, ou ayant besoin d'une attention particulière"
              alone
              onPress={() => onChange({ alertness: !person.alertness }, true)}
              value={person.alertness}
            />
            <TeamsMultiCheckBoxes
              values={context.teams.filter((t) => person.assignedTeams.includes(t._id)).map((t) => t.name)}
              onChange={(newAssignedTeams) =>
                onChange({
                  assignedTeams: newAssignedTeams.map((teamName) => context.teams.find((t) => t.name === teamName)?._id),
                })
              }
              editable={editable}
            />
            {!editable && <Spacer />}
            <ButtonsContainer>
              <ButtonDelete onPress={onDeleteRequest} />
              <Button
                caption={editable ? 'Mettre à jour' : 'Modifier'}
                onPress={editable ? onUpdatePerson : onEdit}
                disabled={editable ? isUpdateDisabled() : false}
                loading={updating}
              />
            </ButtonsContainer>
            <ButtonsContainer>
              <Button
                caption={person.outOfActiveList ? 'Réintégrer dans la file active' : 'Sortie de file active'}
                style={{ marginRight: 10 }}
                onPress={() => (person.outOfActiveList ? this.onGetBackToActiveList() : this.onRemoveFromActiveList())}
                color={colors.warning.color}
              />
            </ButtonsContainer>

            <SubList
              label="Actions"
              onAdd={this.onAddActionRequest}
              data={actions.filter((a) => a.person === person.person._id)}
              renderItem={(action, index) => (
                <ActionRow
                  key={index}
                  action={action}
                  showStatus
                  withTeamName
                  onActionPress={() => {
                    Sentry.setContext('action', { _id: action._id });
                    navigation.push('Actions', {
                      screen: 'Action',
                      params: { _id: action._id, fromRoute: 'Person' },
                    });
                  }}
                />
              )}
              ifEmpty="Pas encore d'action"
            />
            <SubList
              label="Commentaires"
              data={comments.filter((c) => c.person === person.person._id)}
              renderItem={(comment, index) => (
                <CommentRow
                  key={index}
                  comment={comment.comment}
                  id={comment._id}
                  user={comment.user}
                  createdAt={comment.createdAt}
                  onUpdate={comment.team ? () => this.onCommentUpdate(comment) : null}
                  metaCaption="Commentaire de"
                />
              )}
              ifEmpty="Pas encore de commentaire">
              <NewCommentInput
                forwardRef={(r) => (this.newCommentRef = r)}
                onFocus={() => this._scrollToInput(this.newCommentRef)}
                person={person.person._id}
                writeComment={this.props.writeComment}
              />
            </SubList>
            <SubList
              label="Lieux fréquentés"
              onAdd={this.onAddPlaceRequest}
              data={relsPersonPlace.filter((rel) => rel.person === person.person._id)}
              renderItem={(rel, index) => {
                const place = { ...places.find((pl) => pl._id === rel.place), ...rel };
                return (
                  <CommentRow
                    key={index}
                    comment={place.name}
                    createdAt={place.createdAt}
                    user={place.user}
                    onPress={() => this.onPlaceMore(place)}
                    metaCaption="Lieu ajouté par"
                  />
                );
              }}
              ifEmpty="Pas encore de lieu"
            />
          </ScrollContainer>
        )}
      </>
    );
  }
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 30px;
`;

const AlterOutOfActiveList = styled.View`
  margin-bottom: 20px;
  border-radius: 10px;
  background-color: ${colors.app.colorGrey};
  padding: 10px;
`;

export default compose(
  withContext(ActionsContext),
  withContext(RelsPersonPlaceContext),
  withContext(PlacesContext),
  withContext(AuthContext),
  connectActionSheet
)(PersonSummary);
