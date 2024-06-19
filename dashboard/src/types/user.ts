// types/user.ts
import { UUIDV4 } from "./uuid";
import { TeamInstance } from "./team";

export type UserInstance = {
  _id: UUIDV4;
  name: string;
  email: string;
  organisation: UUIDV4;
  lastLoginAt: Date | null;
  termsAccepted: Date | null;
  cgusAccepted: Date | null;
  phone: string | null;
  healthcareProfessional: boolean | null;
  role: "normal" | "admin" | "superadmin" | "restricted-access" | "stats-only";
  team?: Array<TeamInstance["_id"]>;
  teams?: Array<TeamInstance>;
  createdAt?: Date;
  decryptAttempts?: number;
};
