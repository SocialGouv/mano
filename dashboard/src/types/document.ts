import { UUIDV4 } from './uuid';
import type { PersonInstance } from './person';

export type Document = {
  _id: UUIDV4;
  person: UUIDV4;
  personPopulated?: PersonInstance;
  name: string;
  encryptedEntityKey: string;
  createdAt: Date;
  createdBy: UUIDV4;
  downloadPath: string;
  file: {
    originalname: string;
    filename: string;
    size: number;
    encoding: string;
    mimetype: string;
  };
  // for folder
  ancestor?: string;
  order?: number;
};
