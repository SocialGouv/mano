import localforage from 'localforage';
import { atom } from 'recoil';

const collectionName = 'action';
export const actionsState = atom({
  key: collectionName,
  default: [],
  effects: [
    ({ onSet }) => {
      onSet(async (newValue) => {
        await localforage.setItem(collectionName, newValue);
      });
    },
  ],
});

const encryptedFields = ['category', 'categories', 'person', 'structure', 'name', 'description', 'withTime', 'team', 'user', 'urgent'];

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

const sortTodo = (a, b) => {
  if (!a.dueAt) return 1;
  if (!b.dueAt) return -1;
  if (a.dueAt > b.dueAt) return 1;
  return -1;
};

const sortDoneOrCancel = (a, b) => {
  if (!a.dueAt) return -1;
  if (!b.dueAt) return 1;
  if (a.dueAt > b.dueAt) return -1;
  return 1;
};

export const sortActions = (a, b) => {
  if (a.status === TODO && b.status !== TODO) return -1;
  if (a.status !== TODO && b.status === TODO) return 1;
  if (a.status === TODO && b.status === TODO) return sortTodo(a, b);
  if (a.status === DONE && b.status === DONE) return sortDoneOrCancel(a, b);
  if (a.status === CANCEL && b.status === CANCEL) return sortDoneOrCancel(a, b);
};

export const actionsCategories = [
  'Accompagnement Médical',
  'Accompagnement Social',
  'Accompagnement Juridique',
  'Accompagnement Autre',
  'Accompagnement Entretien',
  'Accompagnement dans les démarches',
  'Contact',
  'Consultation',
  'Démarche Sociale',
  'Démarche Médicale',
  'Démarche Juridique',
  'Distribution',
  'Entretien psychothérapeutique',
  'Entretien organisationnel',
  'Orientation',
  'Rappel de rdv',
  'Soins',
  'Travail avec partenaire social',
  'Travail avec partenaire sanitaire',
  'Travail avec partenaire autre',
  'Travail avec collaborateur bailleur',
  'Réunion de synthèse',
  'Visite Hôpital',
  'Visite Prison',
  'Visite Domicile',
  'Ramassage',
  'Informer',
  'Rechercher',
  'Explorer',
  'Signalement',
  'Médiation',
];
