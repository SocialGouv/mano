import { atom } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";
import type { TreatmentInstance } from "../types/treatment";
import { encryptItem } from "../services/encryption";

const collectionName = "treatment";
export const treatmentsState = atom<TreatmentInstance[]>({
  key: collectionName,
  default: [],
});

const encryptedFields: Array<keyof TreatmentInstance> = [
  "person",
  "user",
  "startDate",
  "endDate",
  "name",
  "dosage",
  "frequency",
  "indication",
  "documents",
  "comments",
  "history",
];

export const allowedTreatmentFieldsInHistory = [
  { name: "person", label: "Personne suivie" },
  { name: "name", label: "Nom du traitement" },
  { name: "startDate", label: "Date de début" },
  { name: "endDate", label: "Date de fin" },
  { name: "dosage", label: "Dosage" },
  { name: "frequency", label: "Fréquence" },
  { name: "indication", label: "Indication" },
];

export const prepareTreatmentForEncryption = (treatment: TreatmentInstance, { checkRequiredFields = true } = {}) => {
  if (checkRequiredFields) {
    try {
      if (!looseUuidRegex.test(treatment.person)) {
        throw new Error("Treatment is missing person");
      }
      if (!looseUuidRegex.test(treatment.user)) {
        throw new Error("Treatment is missing user");
      }
    } catch (error) {
      toast.error(
        "Le traitement n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error);
      throw error;
    }
  }
  const decrypted: any = {};
  for (const field of encryptedFields) {
    decrypted[field] = treatment[field];
  }
  return {
    _id: treatment._id,
    createdAt: treatment.createdAt,
    updatedAt: treatment.updatedAt,
    deletedAt: treatment.deletedAt,
    organisation: treatment.organisation,

    decrypted,
    entityKey: treatment.entityKey,
  };
};

export async function encryptTreatment(treatment: TreatmentInstance, { checkRequiredFields = true } = {}) {
  return encryptItem(prepareTreatmentForEncryption(treatment, { checkRequiredFields }));
}
