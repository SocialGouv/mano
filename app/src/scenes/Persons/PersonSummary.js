import React, { useCallback, useMemo, useRef } from 'react';
import { Linking, Text } from 'react-native';
import styled from 'styled-components';
import * as Sentry from '@sentry/react-native';
import { useRecoilValue } from 'recoil';
import dayjs from 'dayjs';
import ScrollContainer from '../../components/ScrollContainer';
import Button from '../../components/Button';
import InputLabelled from '../../components/InputLabelled';
import ButtonsContainer from '../../components/ButtonsContainer';
import ActionRow from '../../components/ActionRow';
import CommentRow from '../Comments/CommentRow';
import PlaceRow from '../Places/PlaceRow';
import SubList from '../../components/SubList';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import GenderSelect from '../../components/Selects/GenderSelect';
import Spacer from '../../components/Spacer';
import NewCommentInput from '../Comments/NewCommentInput';
import CheckboxLabelled from '../../components/CheckboxLabelled';
import TeamsMultiCheckBoxes from '../../components/MultiCheckBoxes/TeamsMultiCheckBoxes';
import colors from '../../utils/colors';
import PhoneIcon from '../../icons/PhoneIcon';
import { placesState } from '../../recoil/places';
import { organisationState, teamsState } from '../../recoil/auth';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import RencontreRow from './RencontreRow';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';
import { getRelativeTimeFrench } from '../../services/dateDayjs';

const PersonSummary = ({
  navigation,
  person,
  personDB,
  onUpdatePerson,
  updating,
  editable,
  onEdit,
  isUpdateDisabled,
  backgroundColor,
  onCommentWrite,
  onChange,
  onDelete,
  onBack,
}) => {
  const onCommentUpdate = (comment) => {
    navigation.navigate('PersonComment', {
      ...comment,
      commentTitle: personDB.name,
      fromRoute: 'Person',
    });
  };

  const onAddActionRequest = () => {
    navigation.push('NewActionForm', { fromRoute: 'Person', person: personDB });
  };

  const organisation = useRecoilValue(organisationState);
  const scrollViewRef = useRef(null);
  const descriptionRef = useRef(null);
  const newCommentRef = useRef(null);
  const _scrollToInput = (ref) => {
    if (!ref.current) return;
    if (!scrollViewRef.current) return;
    setTimeout(() => {
      ref.current.measureLayout(
        scrollViewRef.current,
        (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        (error) => console.log('error scrolling', error)
      );
    }, 250);
  };

  const onRemoveFromActiveList = async () => navigation.push('PersonsOutOfActiveListReason', { person: personDB, fromRoute: 'Person' });
  const onAddRencontre = async () => navigation.push('Rencontre', { person: personDB, fromRoute: 'Person' });
  const onUpdateRencontre = async (rencontre) => navigation.push('Rencontre', { person: personDB, fromRoute: 'Person', rencontre: rencontre });

  const onGetBackToActiveList = async () => {
    await onUpdatePerson(false, { outOfActiveListReasons: [], outOfActiveList: false });
  };

  console.log('personDB', personDB?._id);
  const populatedPersons = useRecoilValue(itemsGroupedByPersonSelector);
  const populatedPerson = useMemo(() => populatedPersons[personDB?._id] || {}, [populatedPersons, personDB._id]);
  const { actions, comments, rencontres, relsPersonPlace } = populatedPerson;

  const sortedActions = useMemo(() => [...(actions || [])].sort((p1, p2) => (p1.dueAt > p2.dueAt ? -1 : 1)), [actions]);

  const allPlaces = useRecoilValue(placesState);
  const places = useMemo(() => {
    if (!relsPersonPlace) return [];
    const placesId = relsPersonPlace.map((rel) => rel.place);
    return allPlaces.filter((pl) => placesId.includes(pl._id));
  }, [allPlaces, relsPersonPlace]);
  const onAddPlaceRequest = () => navigation.push('NewPersonPlaceForm', { person: populatedPerson, fromRoute: 'Person' });

  const teams = useRecoilValue(teamsState);

  const onActionPress = useCallback(
    (action) => {
      Sentry.setContext('action', { _id: action._id });
      navigation.push('Action', { action, fromRoute: 'Person' });
    },
    [navigation]
  );

  return (
    <ScrollContainer ref={scrollViewRef} backgroundColor={backgroundColor || colors.app.color} testID="person-summary">
      {person.outOfActiveList && (
        <AlterOutOfActiveList>
          <Text style={{ color: colors.app.colorWhite }}>
            {person?.name} est en dehors de la file active, pour{' '}
            {person?.outOfActiveListReasons?.length > 1 ? 'les motifs suivants' : 'le motif suivant'} : {person.outOfActiveListReasons.join(', ')}
            {person?.outOfActiveListDate && `le ${formatDateWithFullMonth(person.outOfActiveListDate)}`}
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
        <InputLabelled
          label="Âge"
          value={person.birthdate ? `${dayjs().from(dayjs(person.birthdate), true)} (${dayjs(person.birthdate).format('DD/MM/YYYY')})` : null}
          placeholder="JJ-MM-AAAA"
          editable={false}
        />
      )}
      {editable ? (
        <DateAndTimeInput
          label="Suivi(e) depuis / Créé(e) le"
          setDate={(followedSince) => onChange({ followedSince })}
          date={person.followedSince}
          editable={editable}
          showYear
        />
      ) : (
        <InputLabelled
          label="Suivi(e) depuis / Créé(e) il y a"
          value={`${getRelativeTimeFrench(dayjs(), person.followedSince)} (${dayjs(person.followedSince).format('DD/MM/YYYY')})`}
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
          label="En rue depuis"
          value={
            person.wanderingAt ? `${getRelativeTimeFrench(dayjs(), person.wanderingAt)} (${dayjs(person.wanderingAt).format('DD/MM/YYYY')})` : null
          }
          placeholder="JJ-MM-AAAA"
          editable={false}
        />
      )}
      <Row>
        <InputLabelled
          label="Téléphone"
          onChangeText={(phone) => onChange({ phone })}
          value={person.phone}
          placeholder="06 12 52 32 13"
          textContentType="telephoneNumber"
          keyboardType="phone-pad"
          autoCorrect={false}
          editable={editable}
          noMargin={editable || !!personDB?.phone?.length}
        />
        <Spacer />
        {!!personDB?.phone?.length && (
          <Button
            caption="Appeler"
            Icon={PhoneIcon}
            color={colors.app.secondary}
            onPress={() => Linking.openURL('tel:' + personDB?.phone?.split(' ').join(''))}
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
        ref={descriptionRef}
        onFocus={() => _scrollToInput(descriptionRef)}
      />
      <CheckboxLabelled
        label="Personne vulnérable, ou ayant besoin d'une attention particulière"
        alone
        onPress={() => onChange({ alertness: !person.alertness }, true)}
        value={person.alertness}
      />
      <TeamsMultiCheckBoxes
        values={teams.filter((t) => person.assignedTeams.includes(t._id)).map((t) => t.name)}
        onChange={(newAssignedTeams) =>
          onChange({
            assignedTeams: newAssignedTeams.map((teamName) => teams.find((t) => t.name === teamName)?._id),
          })
        }
        editable={editable}
      />
      {!editable && <Spacer />}
      <ButtonsContainer>
        <DeleteButtonAndConfirmModal
          title={`Voulez-vous vraiment supprimer ${personDB?.name} ?`}
          onBack={onBack}
          textToConfirm={personDB?.name}
          roles={['normal', 'admin']}
          roleErrorMessage="Désolé, seules les personnes autorisées peuvent supprimer des personnes"
          onDelete={onDelete}>
          Cette opération est irréversible{'\n'}et entrainera la suppression définitive{'\n'}de toutes les données liées à la personne&nbsp;:{'\n\n'}
          actions, commentaires, lieux visités, passages, rencontres, documents...
        </DeleteButtonAndConfirmModal>
        <Button
          caption={editable ? 'Mettre à jour' : 'Modifier'}
          onPress={editable ? onUpdatePerson : onEdit}
          disabled={editable ? isUpdateDisabled : false}
          loading={updating}
        />
      </ButtonsContainer>
      <ButtonsContainer>
        <Button
          caption={person.outOfActiveList ? 'Réintégrer dans la file active' : 'Sortie de file active'}
          onPress={() => (person.outOfActiveList ? onGetBackToActiveList() : onRemoveFromActiveList())}
          color={colors.warning.color}
        />
      </ButtonsContainer>

      <SubList
        label="Actions"
        onAdd={onAddActionRequest}
        testID="person-actions-list"
        data={sortedActions}
        renderItem={(action, index) => (
          <ActionRow key={index} action={action} showStatus withTeamName testID="person-action" onActionPress={onActionPress} />
        )}
        ifEmpty="Pas encore d'action"
      />
      <SubList
        label="Commentaires"
        data={comments}
        renderItem={(comment) => <CommentRow key={comment._id} comment={comment} onUpdate={comment.team ? () => onCommentUpdate(comment) : null} />}
        ifEmpty="Pas encore de commentaire">
        <NewCommentInput
          forwardRef={newCommentRef}
          onFocus={() => _scrollToInput(newCommentRef)}
          person={personDB?._id}
          onCommentWrite={onCommentWrite}
        />
      </SubList>
      {organisation.rencontresEnabled && (
        <SubList
          label="Rencontres"
          onAdd={onAddRencontre}
          data={rencontres}
          renderItem={(rencontre) => <RencontreRow key={rencontre._id} rencontre={rencontre} onUpdate={() => onUpdateRencontre(rencontre)} />}
          ifEmpty="Pas de rencontres"
        />
      )}
      <SubList
        label="Lieux fréquentés"
        onAdd={onAddPlaceRequest}
        data={relsPersonPlace}
        renderItem={(relPersonPlace, index) => {
          const place = places.find((pl) => pl._id === relPersonPlace.place);
          return <PlaceRow key={index} place={place} relPersonPlace={relPersonPlace} personDB={personDB} />;
        }}
        ifEmpty="Pas encore de lieu"
      />
    </ScrollContainer>
  );
};

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 30px;
`;

const ButtonContainer = styled.View`
  margin-bottom: 30px;
`;

const AlterOutOfActiveList = styled.View`
  margin-bottom: 20px;
  border-radius: 10px;
  background-color: ${colors.app.colorGrey};
  padding: 10px;
`;

export default PersonSummary;
