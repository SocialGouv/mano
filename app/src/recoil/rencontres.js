import { atom } from 'recoil';
import { storage } from '../services/dataManagement';
import { looseUuidRegex } from '../utils/regex';
import { capture } from '../services/sentry';
import { Alert } from 'react-native';

export const rencontresState = atom({
  key: 'rencontresState',
  default: JSON.parse(storage.getString('rencontre') || '[]'),
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('rencontre', JSON.stringify(newValue)))],
});

const encryptedFields = ['person', 'team', 'user', 'date', 'observation', 'comment'];

export const prepareRencontreForEncryption = (rencontre) => {
  try {
    if (!looseUuidRegex.test(rencontre.person)) {
      throw new Error('Rencontre is missing person');
    }
    if (!looseUuidRegex.test(rencontre.team)) {
      throw new Error('Rencontre is missing team');
    }
    if (!looseUuidRegex.test(rencontre.user)) {
      throw new Error('Rencontre is missing user');
    }
    if (!rencontre.date) {
      throw new Error('Rencontre is missing date');
    }
  } catch (error) {
    Alert.alert(
      "La rencontre n'a pas été sauvegardée car son format était incorrect.",
      "Vous pouvez vérifier son contenu et tenter de la sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
    );
    capture(error);
    throw error;
  }
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = rencontre[field];
  }
  return {
    _id: rencontre._id,
    createdAt: rencontre.createdAt,
    updatedAt: rencontre.updatedAt,
    organisation: rencontre.organisation,

    decrypted,
    entityKey: rencontre.entityKey,
  };
};
