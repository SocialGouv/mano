import { atom } from 'recoil';
import { looseUuidRegex } from '../utils/regex';
import { capture } from '../services/sentry';
import { Alert } from 'react-native';

const collectionName = 'consultation';
export const consultationsState = atom({
  key: collectionName,
  default: [],
});

export const encryptedFields = ['name', 'type', 'person', 'user', 'documents'];

export const prepareConsultationForEncryption = (customFieldsConsultations) => (consultation) => {
  try {
    if (!looseUuidRegex.test(consultation.person)) {
      throw new Error('Consultation is missing person');
    }
    if (!looseUuidRegex.test(consultation.user)) {
      throw new Error('Consultation is missing user');
    }
  } catch (error) {
    Alert.alert(
      "La consultation n'a pas été sauvegardée car son format était incorrect.",
      "Vous pouvez vérifier son contenu et tenter de la sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
    );
    capture(error, { extra: { consultation } });
    throw error;
  }
  const consultationTypeCustomFields = customFieldsConsultations.find((consult) => consult.name === consultation.type)?.fields || [];
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
    onlyVisibleBy: consultation.onlyVisibleBy || [],

    decrypted,
    entityKey: consultation.entityKey,
  };
};

export const defaultConsultationFields = { isConsultation: true, withTime: true };

export const formatConsultation = (consultation) => {
  return { ...consultation, ...defaultConsultationFields };
};

export const disableConsultationRow = (actionOrConsultation, user) => {
  if (!actionOrConsultation.isConsultation) return false;
  if (!user.healthcareProfessional) return true;
  if (!actionOrConsultation.onlyVisibleBy?.length) return false;
  return !actionOrConsultation.onlyVisibleBy.includes(user._id);
};

export const consultationTypes = ['Psychologique', 'Infirmier', 'Médicale'];
