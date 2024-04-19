// types/user.ts
import { UUIDV4 } from "./uuid";

export type ReportInstance = {
  _id: UUIDV4;
  organisation: UUIDV4;

  entityKey: string;
  createdAt: string; // ISO date
  deletedAt?: string; // ISO date
  updatedAt: string; // ISO date

  team: UUIDV4;
  date: string; // YYYY-MM-DD

  description?: string;
  collaborations?: Array<string>;

  services?: any; // deprecated
  oldDateSystem?: string; // ??? (not documented) - deprecated
};

export type ReadyToEncryptReportInstance = {
  _id: UUIDV4;
  organisation: UUIDV4;

  entityKey: string;
  createdAt: string; // ISO date
  deletedAt?: string; // ISO date
  updatedAt: string; // ISO date

  team: UUIDV4;
  date: string; // YYYY-MM-DD

  decrypted: {
    description?: string;
    collaborations?: Array<string>;
    services?: any; // deprecated
    oldDateSystem?: string; // ??? (not documented) - deprecated
  };
};
