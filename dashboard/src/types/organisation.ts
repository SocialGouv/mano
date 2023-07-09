import { CustomField, PredefinedField } from './field';

interface GroupedCategories {
  groupTitle: string;
  categories: string[];
}
interface GroupedServices {
  groupTitle: string;
  services: string[];
}

interface CustomFieldsGroup {
  name: string;
  fields: CustomField[];
}

[{ services: ['Médecine généraliste', 'Médecin spéciliste'], groupTitle: 'Orientations' }];
export interface OrganisationInstance {
  _id: string;
  name?: string;

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

  customFieldsObs?: CustomField[];
  personFields?: PredefinedField[];
  customFieldsPersons?: CustomFieldsGroup[];
  customFieldsMedicalFile?: CustomField[];
  fieldsPersonsCustomizableOptions?: CustomField[];
  consultations?: CustomFieldsGroup[];

  actionsGroupedCategories?: GroupedCategories[];
  structuresGroupedCategories?: GroupedCategories[];
}
