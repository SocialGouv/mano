// types/user.ts
import { UUIDV4 } from "./uuid";

export type TeamInstance = {
  _id: UUIDV4;
  name: string;
  organisation: UUIDV4;
  nightSession: boolean | null;
};
