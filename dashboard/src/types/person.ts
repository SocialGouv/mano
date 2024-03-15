import type { UUIDV4 } from "./uuid";
import type { Document, DocumentWithLinkedItem, Folder } from "./document";
import type { UserInstance } from "./user";
import type { GroupInstance } from "./group";
import type { TreatmentInstance } from "./treatment";
import type { ConsultationInstance } from "./consultation";
import type { MedicalFileInstance } from "./medicalFile";

interface PersonInstanceBase {
  outOfActiveList: boolean;
  user: UUIDV4;
  name: string;
  otherNames?: string;
  gender?: "Aucun" | "Homme" | "Femme" | "Homme transgenre" | "Femme transgenre" | "Non binaire" | "Autre";
  birthdate?: Date;
  description?: string;
  alertness?: boolean;
  wanderingAt?: Date;
  phone?: string;
  assignedTeams?: UUIDV4[];
  followedSince?: Date;
  outOfActiveListDate?: Date;
  outOfActiveListReasons?: string[];
  documents?: Array<Document | Folder>;
  [key: string]: any;
}

type PersonField = keyof PersonInstanceBase | string;

export interface PersonInstance extends PersonInstanceBase {
  _id: UUIDV4;
  organisation: UUIDV4;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  history?: Array<{
    date: Date;
    user: UUIDV4;
    data: Record<
      PersonField,
      {
        oldValue: any;
        newValue: any;
      }
    >;
  }>;
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
