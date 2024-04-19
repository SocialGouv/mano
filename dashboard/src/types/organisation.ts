import { CustomField, PredefinedField, CustomFieldsGroup } from "./field";

interface GroupedCategories {
  groupTitle: string;
  categories: string[];
}
interface GroupedServices {
  groupTitle: string;
  services: string[];
}

export interface OrganisationInstance {
  _id: string;
  name: string;

  collaborations?: string[];

  encryptionEnabled?: boolean;
  encryptionLastUpdateAt?: Date;
  encryptedVerificationKey?: string;
  encrypting?: boolean;

  migrating?: boolean;
  migrations?: string[];
  migrationLastUpdateAt?: Date;

  receptionEnabled?: boolean;
  territoriesEnabled?: boolean;
  groupsEnabled?: boolean;
  passagesEnabled?: boolean;
  rencontresEnabled?: boolean;

  groupedServices?: GroupedServices[];
  services?: string[]; // deprecated

  customFieldsObs: CustomField[];
  groupedCustomFieldsObs?: CustomFieldsGroup[];
  personFields: PredefinedField[];
  customFieldsPersons: CustomFieldsGroup[];
  customFieldsMedicalFile: CustomField[];
  groupedCustomFieldsMedicalFile?: CustomFieldsGroup[];
  fieldsPersonsCustomizableOptions: CustomField[];
  consultations: CustomFieldsGroup[];

  actionsGroupedCategories?: GroupedCategories[];
  structuresGroupedCategories?: GroupedCategories[];
}
