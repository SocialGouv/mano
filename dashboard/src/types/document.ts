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

export type DocumentOrFolderId = string;
export interface Document {
  _id: DocumentOrFolderId;
  name: string;
  group?: boolean;
  encryptedEntityKey: string;
  createdAt: Date;
  createdBy: UUIDV4;
  downloadPath: string;
  file: FileMetadata;
  // for tree
  parentId?: DocumentOrFolderId;
  position?: number;
  // type is always equal to 'document'
  type: string;
}

export interface Folder {
  _id: DocumentOrFolderId;
  name: string;
  createdAt?: Date;
  createdBy?: UUIDV4;
  parentId: DocumentOrFolderId | null;
  position: number;
  // type is always equal to 'folder'
  type: string;
}

export interface DocumentForModule extends Document {
  linkedItem: LinkedItem;
}

export interface FolderForModule extends Folder {
  linkedItem: LinkedItem;
}
