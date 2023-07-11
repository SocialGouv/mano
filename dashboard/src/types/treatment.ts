import { UUIDV4 } from './uuid';
import { Document } from './document';

export interface TreatmentInstance {
  _id: string;
  person: UUIDV4;
  organisation: UUIDV4;
  user: UUIDV4;
  entityKey: string;
  startDate: Date;
  endDate: Date;
  name: string;
  dosage: string;
  frequency: string;
  indication: string;
  documents: Document[];
  comments: any[];
  createdAt: Date;
  updatedAt: Date;
}
