import React, { useMemo } from 'react';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState } from '../../recoil/auth';
import API from '../../services/api';
import { rencontresState } from '../../recoil/rencontres';
import BubbleRow from '../../components/BubbleRow';
import { itemsGroupedByPersonSelector } from '../../recoil/selectors';

const RencontreRow = ({ onUpdate, rencontre, showActionSheetWithOptions, itemName, onItemNamePress }) => {
  const personsObject = useRecoilValue(itemsGroupedByPersonSelector);
  const user = useRecoilValue(userState);
  const setRencontres = useSetRecoilState(rencontresState);
  const person = useMemo(() => (rencontre?.person ? personsObject[rencontre.person] : null), [personsObject, rencontre.person]);

  const onMorePress = async () => {
    const options = ['Supprimer', 'Annuler'];
    if (onUpdate && rencontre.user === user._id) options.unshift('Modifier');
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: options.findIndex((o) => o === 'Supprimer'),
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') onUpdate(person);
        if (options[buttonIndex] === 'Supprimer') onRencontreDeleteRequest();
      }
    );
  };

  const onRencontreDeleteRequest = () => {
    Alert.alert('Voulez-vous supprimer cette rencontre ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onRencontreDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onRencontreDelete = async () => {
    const response = await API.delete({ path: `/rencontre/${rencontre._id}` });
    if (!response.ok) return Alert.alert(response.error);
    setRencontres((rencontres) => rencontres.filter((p) => p._id !== rencontre._id));
  };

  return (
    <BubbleRow
      onMorePress={onMorePress}
      caption={rencontre.comment}
      date={rencontre.date || rencontre.createdAt}
      user={rencontre.user}
      urgent={rencontre.urgent}
      itemName={itemName || person?.name || person?.personName}
      onItemNamePress={onItemNamePress}
      metaCaption="Rencontre faite par"
    />
  );
};

export default connectActionSheet(RencontreRow);
