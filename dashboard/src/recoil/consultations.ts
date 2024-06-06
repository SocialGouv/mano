import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";
import type { ConsultationInstance } from "../types/consultation";
import type { CustomFieldsGroup } from "../types/field";
import type { UserInstance } from "../types/user";
import { organisationState } from "./auth";
import { encryptItem } from "../services/encryption";

const collectionName = "consultation";
export const consultationsState = atom<ConsultationInstance[]>({
  key: collectionName,
  default: [],
});

const encryptedFields: Array<keyof ConsultationInstance> = [
  // Normal fields
  "name",
  "type",
  "person",
  "user",
  "teams",
  "documents",
  "comments",
  "history",
  // Medical constants
  "constantes-poids",
  "constantes-frequence-cardiaque",
  "constantes-taille",
  "constantes-saturation-o2",
  "constantes-temperature",
  "constantes-glycemie-capillaire",
  "constantes-frequence-respiratoire",
  "constantes-tension-arterielle-systolique",
  "constantes-tension-arterielle-diastolique",
];

export const excludeConsultationsFieldsFromSearch = new Set([
  "_id",
  "encryptedEntityKey",
  "entityKey",
  "createdBy",
  "documents",
  "user", // because it is an id
  "organisation", // because it is an id
  // "type",
  "person",
  "user",
  "teams",
  "documents",
  // "comments",
  "history",
  "constantes-poids",
  "constantes-frequence-cardiaque",
  "constantes-taille",
  "constantes-saturation-o2",
  "constantes-temperature",
  "constantes-glycemie-capillaire",
  "constantes-frequence-respiratoire",
  "constantes-tension-arterielle-systolique",
  "constantes-tension-arterielle-diastolique",
]);

export const consultationFieldsSelector = selector({
  key: "consultationFieldsSelector",
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation?.consultations || [];
  },
});

export const flattenedCustomFieldsConsultationsSelector = selector({
  key: "flattenedCustomFieldsConsultationsSelector",
  get: ({ get }) => {
    const customFieldsConsultationsSections = get(consultationFieldsSelector);
    const customFieldsConsultations = [];
    for (const section of customFieldsConsultationsSections) {
      for (const field of section.fields) {
        customFieldsConsultations.push(field);
      }
    }
    return customFieldsConsultations;
  },
});

/* Other utils selector */

export const consultationsFieldsIncludingCustomFieldsSelector = selector({
  key: "consultationsFieldsIncludingCustomFieldsSelector",
  get: ({ get }) => {
    const flattenedCustomFieldsConsultations = get(flattenedCustomFieldsConsultationsSelector);
    return [
      { name: "name", label: "Nom" },
      { name: "type", label: "Type" },
      { name: "onlyVisibleBy", label: "Seulement visible par moi" },
      { name: "person", label: "Personne suivie" },
      { name: "teams", label: ":Equipe(s) en charge" },
      { name: "completedAt", label: "Faite le" },
      { name: "dueAt", label: "À faire le" },
      { name: "status", label: "Statut" },
      ...flattenedCustomFieldsConsultations.map((f) => {
        return {
          name: f.name,
          label: f.label,
        };
      }),
    ];
  },
});

export const prepareConsultationForEncryption =
  (customFieldsConsultations: CustomFieldsGroup[]) =>
  (consultation: ConsultationInstance, { checkRequiredFields = true } = {}) => {
    if (checkRequiredFields) {
      try {
        if (!looseUuidRegex.test(consultation.person)) {
          throw new Error("Consultation is missing person");
        }
        if (!looseUuidRegex.test(consultation.user)) {
          throw new Error("Consultation is missing user");
        }
        // we don't force the team (yet) because it's blocking with automatic updates of consultation
        // like merge people + change custom fields
        // if (!looseUuidRegex.test(consultation.teams)) {
        //   throw new Error('Consultation is missing teams');
        // }
      } catch (error) {
        toast.error(
          "La consultation n'a pas été sauvegardée car son format était incorrect. Vous pouvez vérifier son contenu et tenter de la sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
        );
        capture(error);
        throw error;
      }
    }
    const consultationTypeCustomFields = customFieldsConsultations.find((consult) => consult.name === consultation.type)?.fields || [];
    const encryptedFieldsIncludingCustom = [...consultationTypeCustomFields.map((f) => f.name), ...encryptedFields];
    const decrypted: any = {};
    for (const field of encryptedFieldsIncludingCustom) {
      decrypted[field] = consultation[field];
    }
    return {
      _id: consultation._id,
      organisation: consultation.organisation,
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt,
      deletedAt: consultation.deletedAt,

      completedAt: consultation.completedAt,
      dueAt: consultation.dueAt,
      status: consultation.status,
      onlyVisibleBy: consultation.onlyVisibleBy || [],

      decrypted,
      entityKey: consultation.entityKey,
    };
  };

export const encryptConsultation =
  (customFieldsConsultations: CustomFieldsGroup[]) =>
  (consultation: ConsultationInstance, { checkRequiredFields = true } = {}) => {
    return encryptItem(prepareConsultationForEncryption(customFieldsConsultations)(consultation, { checkRequiredFields }));
  };

export const defaultConsultationFields = { isConsultation: true, withTime: true };

export const formatConsultation = (consultation: ConsultationInstance) => {
  return { ...consultation, ...defaultConsultationFields };
};

export const disableConsultationRow = (actionOrConsultation: any, user: UserInstance) => {
  if (!actionOrConsultation.isConsultation) return false;
  if (!user.healthcareProfessional) return true;
  if (!actionOrConsultation.onlyVisibleBy?.length) return false;
  const isVisibleByUser = actionOrConsultation.onlyVisibleBy.includes(user._id);
  const isDisabled = !isVisibleByUser;
  return isDisabled;
};
