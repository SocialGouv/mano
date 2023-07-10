import { UUIDV4 } from './uuid';

type Item = {
  _id: UUIDV4;
  [key: string]: any;
};

export type LinkedItem = {
  item: Item;
  type: 'person' | 'medical-file' | 'consultation' | 'treatment';
};

export type FileMetadata = {
  originalname: string;
  filename: string;
  size: number;
  encoding: string;
  mimetype: string;
};

export interface Document {
  _id: UUIDV4;
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
