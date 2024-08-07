import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import styled from 'styled-components/native';
import Button from '../../components/Button';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import InputMultilineAutoAdjust from '../../components/InputMultilineAutoAdjust';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import { currentTeamState, userState } from '../../recoil/auth';
import { passagesState, preparePassageForEncryption } from '../../recoil/passages';
import API from '../../services/api';

const Passage = ({ navigation, route }) => {
  const personId = route.params.person._id;
  const isNewPassage = !route.params.passage;
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [passage, setPassage] = useState(
    () => route.params.passage || { date: new Date().toISOString(), user: user._id, team: currentTeam._id, person: personId }
  );
  const [submitting, setSubmitting] = useState(false);
  const [passages, setPassages] = useRecoilState(passagesState);

  const createPassage = async () => {
    const response = await API.post({
      path: '/passage',
      body: preparePassageForEncryption(passage),
    });
    if (response.ok) {
      const newPassage = response.decryptedData;

      setPassages([newPassage, ...passages]);
      Alert.alert('Passage ajouté !');
    }
    return response;
  };

  const updatePassage = async () => {
    const response = await API.put({
      path: `/passage/${passage._id}`,
      body: preparePassageForEncryption(passage),
    });
    if (response.ok) {
      const updatedPassage = response.decryptedData;

      setPassages((passages) => passages.map((r) => (r._id === updatedPassage._id ? updatedPassage : r)));
      Alert.alert('Passage modifié !');
    }
    return response;
  };

  return (
    <SceneContainer>
      <ScreenTitle title={isNewPassage ? 'Ajouter un passage' : 'Modifier un passage'} onBack={() => navigation.goBack()} />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <DateAndTimeInput
            label="Date"
            setDate={(date) => setPassage((a) => ({ ...a, date }))}
            date={passage.date}
            showDay
            showTime
            withTime
            editable
          />
          <InputMultilineAutoAdjust
            onChangeText={(x) => setPassage((a) => ({ ...a, comment: x }))}
            value={passage.comment}
            placeholder="Ajouter un commentaire"
          />
          <ButtonContainer>
            <Button
              caption="Valider"
              disabled={false}
              loading={submitting}
              onPress={async () => {
                setSubmitting(true);
                if (isNewPassage) await createPassage();
                else await updatePassage();
                setSubmitting(false);

                navigation.navigate(route.params.fromRoute, { person: route.params.person }, { merge: true });
              }}
            />
          </ButtonContainer>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};

const ButtonContainer = styled.View`
  margin-top: 30px;
`;

export default Passage;
