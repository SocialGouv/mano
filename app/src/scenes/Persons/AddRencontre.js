import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRecoilState, useRecoilValue } from 'recoil';
import styled from 'styled-components';
import Button from '../../components/Button';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import InputMultilineAutoAdjust from '../../components/InputMultilineAutoAdjust';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import { currentTeamState, userState } from '../../recoil/auth';
import { rencontresState, prepareRencontreForEncryption } from '../../recoil/rencontres';
import API from '../../services/api';

const AddRencontre = ({ navigation, route }) => {
  const personId = route.params.person._id;
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [rencontre, setRencontre] = useState(() => ({ date: new Date(), user: user._id, team: currentTeam._id, person: personId }));
  const [submitting, setSubmitting] = useState(false);
  const [rencontres, setRencontres] = useRecoilState(rencontresState);

  const createRencontre = async () => {
    const response = await API.post({
      path: '/rencontre',
      body: prepareRencontreForEncryption(rencontre),
    });
    if (response.ok) {
      const newRencontre = response.decryptedData;

      setRencontres([newRencontre, ...rencontres]);
      Alert.alert('Rencontre ajoutée !');
    }
    return response;
  };

  return (
    <SceneContainer>
      <ScreenTitle title="Ajouter une rencontre" onBack={() => navigation.goBack()} />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <DateAndTimeInput
            label="Date"
            setDate={(date) => setRencontre((a) => ({ ...a, date }))}
            date={rencontre.date}
            showDay
            withTime={false}
            editable={true}
          />
          <InputMultilineAutoAdjust
            onChangeText={(x) => setRencontre((a) => ({ ...a, comment: x }))}
            value={rencontre.comment}
            placeholder="Ajouter un commentaire"
          />
          <ButtonContainer>
            <Button
              caption="Valider"
              disabled={false}
              loading={submitting}
              onPress={async () => {
                setSubmitting(true);
                await createRencontre();
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

export default AddRencontre;
