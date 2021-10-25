import React, { useState, useContext } from 'react';
import { View } from 'react-native';
import Button from '../../components/Button';
import SceneContainer from '../../components/SceneContainer';
import ScreenTitle from '../../components/ScreenTitle';
import ScrollContainer from '../../components/ScrollContainer';
import OutOfActiveListReasonSelect from '../../components/Selects/OutOfActiveListReasonSelect';
import PersonsContext from '../../contexts/persons';

export default function PersonsOutOfActiveListReason({ navigation, route }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { updatePerson } = useContext(PersonsContext);

  const { person } = route.params;

  return (
    <SceneContainer>
      <ScreenTitle title="Sortie de file active" onBack={() => navigation.goBack()} />
      <ScrollContainer keyboardShouldPersistTaps="handled">
        <View>
          <OutOfActiveListReasonSelect value={reason} onSelect={(value) => setReason(value)} editable={true} />
          <Button
            caption="Créer"
            disabled={!reason}
            loading={submitting}
            onPress={async () => {
              setSubmitting(true);
              await updatePerson({ ...person, outOfActiveListReason: reason, outOfActiveList: true });
              setSubmitting(false);
              navigation.replace('Persons', { screen: 'Person', params: { ...person } });
            }}
          />
        </View>
      </ScrollContainer>
    </SceneContainer>
  );
}
