import React, { useState } from 'react';
import { View } from 'react-native';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import Button from '../../components/Button';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import OutOfActiveListReasonSelect from '../../components/Selects/OutOfActiveListReasonSelect';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import {
  commentForUpdatePerson,
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import API from '../../services/api';

const PersonsOutOfActiveListReason = ({ navigation, route }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [persons, setPersons] = useRecoilState(personsState);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const setComments = useSetRecoilState(commentsState);

  const updatePerson = async () => {
    const person = { ...route.params.person, outOfActiveListReason: reason, outOfActiveList: true };
    const oldPerson = persons.find((a) => a._id === person._id);
    const response = await API.put({
      path: `/person/${person._id}`,
      body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(person),
    });
    if (response.ok) {
      const newPerson = response.decryptedData;
      setPersons((persons) =>
        persons.map((p) => {
          if (p._id === person._id) return newPerson;
          return p;
        })
      );
      const comment = commentForUpdatePerson({ newPerson, oldPerson });
      if (comment) {
        comment.user = user._id;
        comment.team = currentTeam._id;
        comment.organisation = organisation._id;
        const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
        if (commentResponse.ok) setComments((comments) => [response.decryptedData, ...comments]);
      }
    }
    return response;
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Sortie de file active" onBack={() => navigation.goBack()} />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <OutOfActiveListReasonSelect value={reason} onSelect={(value) => setReason(value)} editable={true} />
          <Button
            caption="Valider"
            disabled={!reason}
            loading={submitting}
            onPress={async () => {
              setSubmitting(true);
              await updatePerson();
              setSubmitting(false);
              navigation.navigate('PersonsList');
            }}
          />
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

export default PersonsOutOfActiveListReason;
