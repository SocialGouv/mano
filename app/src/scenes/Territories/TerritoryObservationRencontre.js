import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useRecoilValue } from 'recoil';
import Button from '../../components/Button';
import DateAndTimeInput from '../../components/DateAndTimeInput';
import InputMultilineAutoAdjust from '../../components/InputMultilineAutoAdjust';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import { currentTeamState, userState } from '../../recoil/auth';
import Label from '../../components/Label';
import { MyText } from '../../components/MyText';
import Tags from '../../components/Tags';
import { useFocusEffect } from '@react-navigation/native';

const TerritoryObservationRencontre = ({ navigation, route }) => {
  const isNewRencontre = !route.params.rencontre;
  const [rencontrePersons, setRencontrePersons] = useState(() => (route.params?.person ? [route.params?.person] : []));
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [rencontre, setRencontre] = useState(
    () =>
      route.params.rencontre || {
        date: new Date().toISOString(),
        user: user._id,
        team: currentTeam._id,
        person: null,
      }
  );
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const newPerson = route?.params?.person;
      if (newPerson) {
        setRencontrePersons((rencontrePersons) => [...rencontrePersons.filter((p) => p._id !== newPerson._id), newPerson]);
      }
    }, [route?.params?.person])
  );

  const onSearchPerson = () => navigation.push('PersonsSearch', { fromRoute: 'TerritoryObservationRencontre', territory: route.params.territory });

  return (
    <SceneContainer>
      <ScreenTitle title={isNewRencontre ? 'Ajouter une rencontre' : 'Modifier une rencontre'} onBack={() => navigation.goBack()} />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <>
            <Label label="Personne(s) concerné(es)" />
            <Tags
              data={rencontrePersons}
              onChange={(persons) => {
                setRencontrePersons(persons);
              }}
              editable
              onAddRequest={onSearchPerson}
              renderTag={(person) => <MyText>{person?.name}</MyText>}
            />
          </>
          <DateAndTimeInput
            label="Date"
            setDate={(date) => setRencontre((a) => ({ ...a, date }))}
            date={rencontre.date}
            showDay
            showTime
            withTime
            editable
          />
          <InputMultilineAutoAdjust
            onChangeText={(x) => setRencontre((a) => ({ ...a, comment: x }))}
            value={rencontre.comment}
            placeholder="Ajouter un commentaire"
          />
          <View className="mt-8">
            <Button
              caption="Valider"
              disabled={false}
              loading={submitting}
              onPress={async () => {
                setSubmitting(true);
                setSubmitting(false);
                navigation.navigate('TerritoryObservation', {
                  territory: route.params.territory,
                  rencontresInProgress: rencontrePersons.map(
                    (p) => {
                      return {
                        ...rencontre,
                        person: p._id,
                      };
                    },
                    { merge: true }
                  ),
                });
              }}
            />
          </View>
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
};
export default TerritoryObservationRencontre;
