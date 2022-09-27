import React from 'react';
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Alert } from 'react-native';
import { useSetRecoilState } from 'recoil';
import API from '../../services/api';
import BubbleRow from '../../components/BubbleRow';
import { useNavigation } from '@react-navigation/native';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';

const PlaceRow = ({ place, relPersonPlace, personDB, showActionSheetWithOptions }) => {
  const navigation = useNavigation();
  const setRelsPersonPlace = useSetRecoilState(relsPersonPlaceState);

  const onMorePress = async () => {
    const options = ['Modifier', 'Retirer', 'Annuler'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: options.findIndex((o) => o === 'Retirer'),
      },
      async (buttonIndex) => {
        if (options[buttonIndex] === 'Modifier') {
          navigation.navigate('PersonPlace', {
            _id: relPersonPlace.place,
            personName: personDB?.name,
            fromRoute: 'Person',
          });
        }
        if (options[buttonIndex] === 'Retirer') onRelPersonPlaceRequest();
      }
    );
  };

  const onRelPersonPlaceRequest = () => {
    Alert.alert('Voulez-vous supprimer ce lieu fréquenté ?', 'Cette opération est irréversible.', [
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onRelPersonPlaceDelete,
      },
      {
        text: 'Annuler',
        style: 'cancel',
      },
    ]);
  };

  const onRelPersonPlaceDelete = async () => {
    const response = await API.delete({ path: `/relPersonPlace/${relPersonPlace?._id}` });
    if (response.ok) {
      setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace?._id));
    }
    if (!response.ok) return Alert.alert(response.error);
  };

  return (
    <BubbleRow
      onMorePress={onMorePress}
      caption={place.name}
      date={relPersonPlace.createdAt}
      user={relPersonPlace.user}
      metaCaption="Lieu ajouté par"
    />
  );
};

export default connectActionSheet(PlaceRow);
