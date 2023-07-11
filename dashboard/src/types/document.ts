import { UUIDV4 } from './uuid';
import { MedicalFileInstance } from './medicalFile';
import { ConsultationInstance } from './consultation';
import { TreatmentInstance } from './treatment';
import { PersonInstance } from './person';

export type LinkedItem =
  | {
      item: MedicalFileInstance;
      type: 'medical-file';
    }
  | {
      item: ConsultationInstance;
      type: 'consultation';
    }
  | {
      item: TreatmentInstance;
      type: 'treatment';
    }
  | {
      item: PersonInstance;
      type: 'person';
    };

export type FileMetadata = {
  originalname: string;
  filename: string;
  size: number;
  encoding: string;
  mimetype: string;
};

export interface Document {
  _id: string;
  name: string;
  group?: boolean;
  encryptedEntityKey: string;
  createdAt: Date;
  createdBy: UUIDV4;
  downloadPath: string;
  file: FileMetadata;
  // for folder
  ancestor?: string;
  order?: number;
}

export interface DocumentForModule extends Document {
  linkedItem: LinkedItem;
}
