import { UUIDV4 } from './uuid';

export interface ElementHistory {
  date: Date;
  user: UUIDV4;
  data: HistoryData<any>;
}

interface HistoryData<T> {
  oldValue: T;
  newValue: T;
}
