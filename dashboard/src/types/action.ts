import { UUIDV4 } from './uuid';

export interface ActionInstance {
  _id: string;
  status: 'TODO' | 'DONE' | 'CANCEL';
  person?: UUIDV4;
  organisation: UUIDV4;
  user: UUIDV4;
  category?: string;
  categories: string[];
  team?: UUIDV4;
  teams: UUIDV4[];
  group?: UUIDV4;
  structure?: UUIDV4;
  name: string;
  description: string;
  withTime: boolean;
  urgent: boolean;
  history: any[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | undefined;
  isConsultation?: boolean;
}
