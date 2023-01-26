import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';
import { looseUuidRegex } from '../utils';
import { toast } from 'react-toastify';
import { capture } from '../services/sentry';

const collectionName = 'place';
export const placesState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ['user', 'name'];

export const preparePlaceForEncryption = (place) => {
  try {
    if (!place.name) {
      throw new Error('Place is missing name');
    }
    // CAREFUL: there are too many places where we didn't setup the user for places...
    // but we fixed it in the dashboard: is no user, then current user
    // so we can test here
    if (!looseUuidRegex.test(place.user)) {
      throw new Error('Place is missing user');
    }
  } catch (error) {
    toast.error(
      "Le lieu n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
    );
    console.log('place', place);
    capture(error, { extra: { place } });
    throw error;
  }
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = place[field];
  }
  return {
    _id: place._id,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    organisation: place.organisation,

    decrypted,
    entityKey: place.entityKey,
  };
};
