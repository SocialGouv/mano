import { UUIDV4 } from "./uuid";

export type Relation = {
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
  _id: UUIDV4;
  organisation: UUIDV4;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  entityKey: string;
}

export type GroupToBeEncrypted = Omit<GroupInstance, EncryptedGroupKeys> & {
  decrypted: EncryptedGroupFields;
};
