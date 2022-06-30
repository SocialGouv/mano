import { atom } from 'recoil';

const collectionName = 'consultation';
export const consultationsState = atom({
  key: collectionName,
  default: [],
});

const encryptedFields = ['name', 'type', 'person', 'user', 'documents'];

export const prepareConsultationForEncryption = (customFieldsConsultations) => (consultation) => {
  const consultationTypeCustomFields = customFieldsConsultations.find((consult) => consult.name === consultation.type).fields;
  const encryptedFieldsIncludingCustom = [...consultationTypeCustomFields.map((f) => f.name), ...encryptedFields];
  const decrypted = {};
  for (let field of encryptedFieldsIncludingCustom) {
    decrypted[field] = consultation[field];
  }
  return {
    _id: consultation._id,
    organisation: consultation.organisation,
    createdAt: consultation.createdAt,
    updatedAt: consultation.updatedAt,

    completedAt: consultation.completedAt,
    dueAt: consultation.dueAt,
    status: consultation.status,
    onlyVisibleBy: consultation.onlyVisibleBy,

    decrypted,
    entityKey: consultation.entityKey,
  };
};

const allowedFieldsForNonProfessional = [
  '_id',
  'organisation',
  'createdAt',
  'updatedAt',
  'completedAt',
  'dueAt',
  'status',
  'onlyVisibleBy',
  'entityKey',
  'person',
  'user',
];

export const defaultConsultationFields = { isConsultation: true, withTime: true };

export const whitelistAllowedData = (consultation, user) => {
  if (!user.healthcareProfessional || (consultation.onlyVisibleBy?.length && !consultation.onlyVisibleBy.includes(user._id))) {
    const allowedConsultation = { ...defaultConsultationFields };
    for (const allowedField of allowedFieldsForNonProfessional) {
      allowedConsultation[allowedField] = consultation[allowedField];
    }
    return allowedConsultation;
  }
  return { ...consultation, ...defaultConsultationFields };
};

export const disableConsultationRow = (actionOrConsultation, user) => {
  if (!actionOrConsultation.isConsultation) return false;
  if (!user.healthcareProfessional) return true;
  if (!actionOrConsultation.onlyVisibleBy?.length) return false;
  return !actionOrConsultation.onlyVisibleBy.includes(user._id);
};

export const consultationTypes = ['Psychologique', 'Infirmier', 'Médicale'];
