// types/user.ts
import { UUIDV4 } from "./uuid";

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
  role: "normal" | "admin"; // Add other roles if available.
  team?: UUIDV4[];
  teams?: UUIDV4[];
  createdAt?: Date;
};
