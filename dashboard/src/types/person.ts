import type { UUIDV4 } from './uuid';
import type { ElementHistory } from './history';
import type { Document, DocumentWithLinkedItem, Folder } from './document';
import type { UserInstance } from './user';
import type { GroupInstance } from './group';
import type { TreatmentInstance } from './treatment';
import type { ConsultationInstance } from './consultation';
import type { MedicalFileInstance } from './medicalFile';

export interface PersonInstance {
  _id: UUIDV4;
  organisation: UUIDV4;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  outOfActiveList: boolean;
  user: UUIDV4;
  name: string;
  otherNames?: string;
  gender?: 'Aucun' | 'Homme' | 'Femme' | 'Homme transgenre' | 'Femme transgenre' | 'Non binaire' | 'Autre';
  birthdate?: Date;
  description?: string;
  alertness?: boolean;
  wanderingAt?: Date;
  phone?: string;
  assignedTeams?: UUIDV4[]; // You might need to adjust this type based on what the actual values are.
  followedSince?: Date;
  outOfActiveListDate?: Date;
  outOfActiveListReasons?: string[];
  documents?: Array<Document | Folder>;
  history?: ElementHistory[];
  [key: string]: any; // This allows for additional properties
}

export interface PersonPopulated extends PersonInstance {
  userPopulated: UserInstance;
  formattedBirthDate: string;
  age: number;
  formattedPhoneNumber: string;
  interactions: Date[];
  lastUpdateCheckForGDPR: Date;
  group?: GroupInstance;
  documentsForModule?: DocumentWithLinkedItem[];
  groupDocuments?: DocumentWithLinkedItem[];
  actions?: any[];
  comments?: any[];
  places?: any[];
  relsPersonPlace?: any[];
  consultations?: ConsultationInstance[];
  hasAtLeastOneConsultation?: boolean;
  treatments?: TreatmentInstance[];
  commentsMedical?: any[];
  medicalFile?: MedicalFileInstance;
  passages?: any[];
  rencontres?: any[];
}
