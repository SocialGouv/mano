import { UUIDV4 } from "./uuid";

export interface TerritoryObservationInstance {
  _id: string;
  organisation: UUIDV4;
  entityKey: string;
  createdAt: string; // ISO date
  deletedAt?: string; // ISO date
  updatedAt: string; // ISO date

  territory: UUIDV4;
  user: UUIDV4;
  team: UUIDV4;
  observedAt: Date;

  [key: string]: any; // custom fields
}

export interface ReadyToEncryptTerritoryObservationInstance {
  _id: string;
  organisation: UUIDV4;
  entityKey: string;
  createdAt: string; // ISO date
  deletedAt?: string; // ISO date
  updatedAt: string; // ISO date

  decrypted: {
    territory?: UUIDV4;
    user?: UUIDV4;
    team?: UUIDV4;
    observedAt?: Date;
    [key: string]: any; // custom fields
  };
}
