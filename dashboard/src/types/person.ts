import type { UUIDV4 } from './uuid';
import type { ElementHistory } from './history';
import type { Document } from './document';

export interface PersonInstance {
  _id: UUIDV4;
  organisation: UUIDV4;
  createdAt: Date;
  updatedAt: Date;
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
  documents?: Document[]; // You might need to adjust this type based on what the actual values are.
  history?: ElementHistory[];
  [key: string]: any; // This allows for additional properties
}
