import { atom, selector } from 'recoil';
import { storage } from '../services/dataManagement';
import { organisationState } from './auth';
import { looseUuidRegex } from '../utils/regex';
import { capture } from '../services/sentry';
import { Alert } from 'react-native';

export const actionsState = atom({
  key: 'actionsState',
  default: JSON.parse(storage.getString('action') || '[]'),
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('action', JSON.stringify(newValue)))],
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

const encryptedFields = [
  'category',
  'categories',
  'person',
  'group',
  'structure',
  'name',
  'description',
  'withTime',
  'team',
  'teams',
  'user',
  'urgent',
  'history',
  'documents',
];

export const allowedActionFieldsInHistory = [
  { name: 'categories', label: 'Catégorie(s)' },
  { name: 'person', label: 'Personne suivie' },
  { name: 'group', label: 'Action familiale' },
  { name: 'name', label: "Nom de l'action" },
  { name: 'description', label: 'Description' },
  { name: 'teams', label: 'Équipe(s) en charge' },
  { name: 'urgent', label: 'Action urgente' },
  { name: 'completedAt', label: 'Faite le' },
  { name: 'dueAt', label: 'À faire le' },
  { name: 'status', label: 'Status' },
];

export const prepareActionForEncryption = (action) => {
  try {
    if (!looseUuidRegex.test(action.person)) {
      throw new Error('Action is missing person');
    }
    for (const team of action.teams) {
      if (!looseUuidRegex.test(team)) {
        throw new Error('Action is missing teams');
      }
    }
    if (!action.teams.length) throw new Error('Action is missing teams');
    if (!looseUuidRegex.test(action.user)) {
      throw new Error('Action is missing user');
    }
  } catch (error) {
    Alert.alert(
      "L'action n'a pas été sauvegardée car son format était incorrect.",
      "Vous pouvez vérifier son contenu et tenter de la sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
    );
    capture(error);
    throw error;
  }
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
