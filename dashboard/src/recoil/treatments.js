import { atom } from 'recoil';
import { looseUuidRegex } from '../utils';
import { toast } from 'react-toastify';
import { capture } from '../services/sentry';

const collectionName = 'treatment';
export const treatmentsState = atom({
  key: collectionName,
  default: [],
});

const encryptedFields = ['person', 'user', 'startDate', 'endDate', 'name', 'dosage', 'frequency', 'indication', 'documents'];

export const prepareTreatmentForEncryption = (treatment, { checkRequiredFields = true } = {}) => {
  if (!!checkRequiredFields) {
    try {
      if (!looseUuidRegex.test(treatment.person)) {
        throw new Error('Treatment is missing person');
      }
      if (!looseUuidRegex.test(treatment.user)) {
        throw new Error('Treatment is missing user');
      }
    } catch (error) {
      toast.error(
        "Le traitement n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error, { extra: { treatment } });
      throw error;
    }
  }
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = treatment[field];
  }
  return {
    _id: treatment._id,
    createdAt: treatment.createdAt,
    updatedAt: treatment.updatedAt,
    organisation: treatment.organisation,

    decrypted,
    entityKey: treatment.entityKey,
  };
};
