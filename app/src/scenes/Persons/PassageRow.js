import React, { useMemo } from 'react';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState } from '../../recoil/auth';
import API from '../../services/api';
import BubbleRow from '../../components/BubbleRow';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';
import { passagesState } from '../../recoil/passages';

const PassageRow = ({ onUpdate, passage, showActionSheetWithOptions, itemName, onItemNamePress }) => {
  const personsObject = useRecoilValue(itemsGroupedByPersonSelector);
  const user = useRecoilValue(userState);
  const setPassages = useSetRecoilState(passagesState);
  const person = useMemo(() => (passage?.person ? personsObject[passage.person] : null), [personsObject, passage.person]);

  const onMorePress = async () => {
    const options = ['Supprimer', 'Annuler'];
    if (onUpdate && passage.user === user._id) options.unshift('Modifier');
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: options.findIndex((o) => o === 'Supprimer'),
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') onUpdate(person);
        if (options[buttonIndex] === 'Supprimer') onPassageDeleteRequest();
      }
    );
  };

  const onPassageDeleteRequest = () => {
    Alert.alert('Voulez-vous supprimer ce passage ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onPassageDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onPassageDelete = async () => {
    const response = await API.delete({ path: `/passage/${passage._id}` });
    if (!response.ok) return Alert.alert(response.error);
    setPassages((passages) => passages.filter((p) => p._id !== passage._id));
  };

  return (
    <BubbleRow
      onMorePress={onMorePress}
      caption={passage.comment}
      date={passage.date || passage.createdAt}
      user={passage.user}
      itemName={itemName || person?.name || person?.personName}
      onItemNamePress={onItemNamePress}
      metaCaption="Passage enregistré par"
    />
  );
};

export default connectActionSheet(PassageRow);
