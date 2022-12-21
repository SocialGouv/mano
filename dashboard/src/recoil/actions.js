import { setCacheItem } from '../services/dataManagement';
import { atom, selector } from 'recoil';
import { organisationState } from './auth';

const collectionName = 'action';
export const actionsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

export const actionsCategoriesSelector = selector({
  key: 'actionsCategoriesSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (organisation.actionsGroupedCategories) return organisation.actionsGroupedCategories;
    return [{ groupTitle: 'Toutes mes catégories', categories: organisation.categories ?? [] }];
  },
});

export const flattenedCategoriesSelector = selector({
  key: 'flattenedCategoriesSelector',
  get: ({ get }) => {
    const actionsGroupedCategories = get(actionsCategoriesSelector);
    return actionsGroupedCategories.reduce((allCategories, { categories }) => [...allCategories, ...categories], []);
  },
});

const encryptedFields = ['category', 'categories', 'person', 'group', 'structure', 'name', 'description', 'withTime', 'team', 'user', 'urgent'];

export const prepareActionForEncryption = (action) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = action[field];
  }
  return {
    _id: action._id,
    organisation: action.organisation,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,

    completedAt: action.completedAt,
    dueAt: action.dueAt,
    status: action.status,

    decrypted,
    entityKey: action.entityKey,
  };
};

export const CHOOSE = 'CHOOSE';
export const TODO = 'A FAIRE';
export const DONE = 'FAIT';
export const CANCEL = 'ANNULEE';

export const mappedIdsToLabels = [
  { _id: TODO, name: 'À FAIRE' },
  { _id: DONE, name: 'FAITE' },
  { _id: CANCEL, name: 'ANNULÉE' },
];

const sortTodo = (a, b, sortOrder) => {
  if (!a.dueAt) return sortOrder === 'ASC' ? 1 : -1;
  if (!b.dueAt) return sortOrder === 'ASC' ? -1 : 1;
  if (a.dueAt > b.dueAt) return sortOrder === 'ASC' ? 1 : -1;
  return sortOrder === 'ASC' ? -1 : 1;
};

const sortDoneOrCancel = (a, b, sortOrder) => {
  if (!a.completedAt) return sortOrder === 'ASC' ? -1 : 1;
  if (!b.completedAt) return sortOrder === 'ASC' ? 1 : -1;
  if (a.completedAt > b.completedAt) return sortOrder === 'ASC' ? -1 : 1;
  return sortOrder === 'ASC' ? 1 : -1;
};

export const getName = (item) => {
  if (item.name) return item.name;
  if (item.isConsultation) return `Consultation ${item.type}`;
  return 'Action'; // should never happen
};

export const sortActionsOrConsultations =
  (sortBy = 'dueAt', sortOrder = 'ASC') =>
  (a, b) => {
    const defaultSort = (a, b) => {
      const aDate = [DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt;
      const bDate = [DONE, CANCEL].includes(b.status) ? b.completedAt : b.dueAt;
      return sortOrder === 'ASC' ? new Date(bDate) - new Date(aDate) : new Date(aDate) - new Date(bDate);
    };
    if (sortBy === 'urgentOrGroupOrConsultation') {
      if (sortOrder === 'ASC') {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        if (a.group && !b.group) return -1;
        if (!a.group && b.group) return 1;
        if (a.isConsultation && !b.isConsultation) return -1;
        if (!a.isConsultation && b.isConsultation) return 1;
      } else {
        if (a.urgent && !b.urgent) return 1;
        if (!a.urgent && b.urgent) return -1;
        if (a.group && !b.group) return 1;
        if (!a.group && b.group) return -1;
        if (a.isConsultation && !b.isConsultation) return 1;
        if (!a.isConsultation && b.isConsultation) return -1;
      }
    }
    if (sortBy === 'name') {
      return sortOrder === 'ASC' ? getName(a).localeCompare(getName(b)) : getName(b).localeCompare(getName(a));
    }
    if (sortBy === 'documents') {
      return sortOrder === 'ASC' ? (b.documents?.length || 0) - (a.documents?.length || 0) : (a.documents?.length || 0) - (b.documents?.length || 0);
    }
    if (sortBy === 'user') {
      if (!a.userPopulated && !b.userPopulated) return defaultSort(a, b);
      if (!a.userPopulated) return sortOrder === 'ASC' ? 1 : -1;
      if (!b.userPopulated) return sortOrder === 'ASC' ? -1 : 1;
      return sortOrder === 'ASC'
        ? a.userPopulated.name.localeCompare(b.userPopulated.name)
        : b.userPopulated.name.localeCompare(a.userPopulated.name);
    }
    if (sortBy === 'person') {
      if (!a.personPopulated && !b.personPopulated) return defaultSort(a, b);
      if (!a.personPopulated) return sortOrder === 'ASC' ? 1 : -1;
      if (!b.personPopulated) return sortOrder === 'ASC' ? -1 : 1;
      return sortOrder === 'ASC'
        ? a.personPopulated.name.localeCompare(b.personPopulated.name)
        : b.personPopulated.name.localeCompare(a.personPopulated.name);
    }
    if (sortBy === 'status') {
      if (a.status === TODO && b.status !== TODO) return sortOrder === 'ASC' ? -1 : 1;
      if (a.status !== TODO && b.status === TODO) return sortOrder === 'ASC' ? 1 : -1;
      if (a.status === DONE && b.status !== DONE) return sortOrder === 'ASC' ? -1 : 1;
      if (a.status !== DONE && b.status === DONE) return sortOrder === 'ASC' ? 1 : -1;
      if (a.status === TODO && b.status === TODO) return sortTodo(a, b, sortOrder);
      if (a.status === DONE && b.status === DONE) return sortDoneOrCancel(a, b, sortOrder);
      if (a.status === CANCEL && b.status === CANCEL) return sortDoneOrCancel(a, b, sortOrder);
    }
    // DEFAULT SORTING
    // (sortBy === 'dueAt')
    return defaultSort(a, b);
  };
