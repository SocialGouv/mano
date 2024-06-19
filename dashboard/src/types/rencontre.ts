import { UUIDV4 } from "./uuid";

export interface RencontreInstance {
  _id?: string;
  organisation?: UUIDV4;
  entityKey?: string;
  createdAt?: string | Date;
  deletedAt?: string | Date;
  updatedAt?: string | Date;

  date?: string | Date;

  person?: UUIDV4;
  persons?: Array<UUIDV4>;
  user: UUIDV4;
  team: UUIDV4;

  observation?: UUIDV4;
  comment?: string;
}

export interface ReadyToEncryptRencontreInstance {
  _id?: string;
  organisation?: UUIDV4;
  entityKey?: string;
  createdAt?: string | Date;
  deletedAt?: string | Date;
  updatedAt?: string | Date;

  decrypted: {
    person: UUIDV4;
    user: UUIDV4;
    team: UUIDV4;
    observation?: UUIDV4;
    comment?: string;
  };
}
