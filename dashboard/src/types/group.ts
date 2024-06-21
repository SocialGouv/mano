import { UUIDV4 } from "./uuid";

export type Relation = {
  _id: UUIDV4;
  persons: UUIDV4[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
  user: UUIDV4;
};

export type EncryptedGroupKeys = "persons" | "relations";

export interface EncryptedGroupFields {
  persons: UUIDV4[];
  relations: Relation[];
}

export interface GroupInstance extends EncryptedGroupFields {
  _id?: UUIDV4;
  organisation?: UUIDV4;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string;
  entityKey?: string;
}

export type GroupToBeEncrypted = Omit<GroupInstance, EncryptedGroupKeys> & {
  decrypted: EncryptedGroupFields;
};
