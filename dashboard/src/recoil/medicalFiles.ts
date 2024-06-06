import { atom, selector } from "recoil";
import { organisationAuthentifiedState } from "./auth";
import { capture } from "../services/sentry";
import { toast } from "react-toastify";
import { looseUuidRegex } from "../utils";
import type { MedicalFileInstance, NewMedicalFileInstance } from "../types/medicalFile";
import type { CustomField } from "../types/field";
import { encryptItem } from "../services/encryption";

const collectionName = "medical-file";
export const medicalFileState = atom<MedicalFileInstance[]>({
  key: collectionName,
  default: [],
});

export const customFieldsMedicalFileSelector = selector<CustomField[]>({
  key: "customFieldsMedicalFileSelector",
  get: ({ get }) => {
    const organisation = get(organisationAuthentifiedState);
    if (Array.isArray(organisation.customFieldsMedicalFile)) return organisation.customFieldsMedicalFile;
    return defaultMedicalFileCustomFields;
  },
});

export const groupedCustomFieldsMedicalFileSelector = selector({
  key: "groupedCustomFieldsMedicalFileSelector",
  get: ({ get }) => {
    const organisation = get(organisationAuthentifiedState);
    if (Array.isArray(organisation.groupedCustomFieldsMedicalFile) && organisation.groupedCustomFieldsMedicalFile.length)
      return organisation.groupedCustomFieldsMedicalFile;
    return [{ name: "Groupe par défaut", fields: defaultMedicalFileCustomFields }];
  },
});

const encryptedFields = ["person", "documents", "comments", "history"];

export const prepareMedicalFileForEncryption =
  (customFieldsMedicalFile: CustomField[]) =>
  (medicalFile: MedicalFileInstance | NewMedicalFileInstance, { checkRequiredFields = true } = {}) => {
    if (checkRequiredFields) {
      try {
        if (!looseUuidRegex.test(medicalFile.person)) {
          throw new Error("MedicalFile is missing person");
        }
      } catch (error) {
        toast.error(
          "Le dossier médical n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
        );
        capture(error);
        throw error;
      }
    }
    const encryptedFieldsIncludingCustom = [...customFieldsMedicalFile.map((f) => f.name), ...encryptedFields];
    const decrypted: any = {};
    for (const field of encryptedFieldsIncludingCustom) {
      decrypted[field] = medicalFile[field];
    }
    return {
      _id: medicalFile._id,
      createdAt: medicalFile.createdAt,
      updatedAt: medicalFile.updatedAt,
      deletedAt: medicalFile.deletedAt,
      organisation: medicalFile.organisation,

      decrypted,
      entityKey: medicalFile.entityKey,
    };
  };

export const encryptMedicalFile =
  (customFieldsMedicalFile: CustomField[]) =>
  (medicalFile: MedicalFileInstance | NewMedicalFileInstance, { checkRequiredFields = true } = {}) => {
    return encryptItem(prepareMedicalFileForEncryption(customFieldsMedicalFile)(medicalFile, { checkRequiredFields }));
  };

const defaultMedicalFileCustomFields: CustomField[] = [
  {
    name: "numeroSecuriteSociale",
    label: "Numéro de sécurité sociale",
    type: "text",
    enabled: true,
    required: false,
    showInStats: false,
  },
];
