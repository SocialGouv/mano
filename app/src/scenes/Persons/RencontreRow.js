import React from 'react';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState } from '../../recoil/auth';
import API from '../../services/api';
import { rencontresState } from '../../recoil/rencontres';
import BubbleRow from '../../components/BubbleRow';

const RencontreRow = ({ onUpdate, rencontre, showActionSheetWithOptions, itemName, onItemNamePress }) => {
  const user = useRecoilValue(userState);
  const setRencontres = useSetRecoilState(rencontresState);

  const onMorePress = async () => {
    const options = ['Supprimer', 'Annuler'];
    if (onUpdate && rencontre.user === user._id) options.unshift('Modifier');
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') onUpdate();
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
      itemName={itemName}
      onItemNamePress={onItemNamePress}
      metaCaption="Rencontreaire de"
    />
  );
};

export default connectActionSheet(RencontreRow);
