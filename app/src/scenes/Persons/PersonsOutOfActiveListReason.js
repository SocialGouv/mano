import React, { useState } from 'react';
import { View } from 'react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import Button from '../../components/Button';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import OutOfActiveListReasonMultiCheckBox from '../../components/Selects/OutOfActiveListReasonMultiCheckBox';
import { userState } from '../../recoil/auth';
import {
  allowedFieldsInHistorySelector,
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import API from '../../services/api';

const PersonsOutOfActiveListReason = ({ navigation, route }) => {
  const [reasons, setReasons] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [persons, setPersons] = useRecoilState(personsState);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const allowedFieldsInHistory = useRecoilValue(allowedFieldsInHistorySelector);

  const user = useRecoilValue(userState);

  const updatePerson = async () => {
    const person = { ...route.params.person, outOfActiveListReasons: reasons, outOfActiveList: true };
    const oldPerson = persons.find((a) => a._id === person._id);

    const historyEntry = {
      date: new Date(),
      user: user._id,
      data: {},
    };
    for (const key in person) {
      if (!allowedFieldsInHistory.includes(key)) continue;
      if (person[key] !== oldPerson[key]) historyEntry.data[key] = { oldValue: oldPerson[key], newValue: person[key] };
    }
    if (!!Object.keys(historyEntry.data).length) person.history = [...(oldPerson.history || []), historyEntry];

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
    }
    return response;
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Sortie de file active" onBack={() => navigation.goBack()} />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <OutOfActiveListReasonMultiCheckBox values={reasons} onChange={setReasons} editable={true} />
          <Button
            caption="Valider"
            disabled={!reasons?.length}
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
