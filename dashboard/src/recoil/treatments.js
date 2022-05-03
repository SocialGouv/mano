import { atom } from 'recoil';

const collectionName = 'treatment';
export const treatmentsState = atom({
  key: collectionName,
  default: [],
});

const encryptedFields = ['person', 'user', 'startDate', 'endDate', 'name', 'dosage', 'frequency', 'indication', 'documents'];

export const prepareTreatmentForEncryption = (treatment) => {
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
