import { UUIDV4 } from './uuid';
import { Document } from './document';

interface AdditionalProps {
  [key: string]: any;
}

export interface MedicalFileInstance extends AdditionalProps {
  _id: string;
  person: UUIDV4;
  organisation: UUIDV4;
  documents: Document[];
  comments: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewMedicalFileInstance extends Omit<MedicalFileInstance, '_id' | 'createdAt' | 'updatedAt'> {}
