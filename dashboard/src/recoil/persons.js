import { setCacheItem } from '../services/dataManagement';
import { atom, selector } from 'recoil';
import { organisationState } from './auth';

const collectionName = 'person';
export const personsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

export const fieldsPersonsCustomizableOptionsSelector = selector({
  key: 'fieldsPersonsCustomizableOptionsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.fieldsPersonsCustomizableOptions)) return organisation.fieldsPersonsCustomizableOptions;
    return fieldsPersonsCustomizableOptions;
  },
});

export const customFieldsPersonsMedicalSelector = selector({
  key: 'customFieldsPersonsMedicalSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.customFieldsPersonsMedical)) return organisation.customFieldsPersonsMedical;
    return defaultMedicalCustomFields;
  },
});

export const customFieldsPersonsSocialSelector = selector({
  key: 'customFieldsPersonsSocialSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.customFieldsPersonsSocial)) return organisation.customFieldsPersonsSocial;
    return [];
  },
});

export const defaultMedicalCustomFields = [
  {
    name: 'consumptions',
    label: 'Consommations',
    type: 'multi-choice',
    options: [
      'Alcool',
      'Amphétamine/MDMA/Ecstasy',
      'Benzodiazépines',
      'Buprénorphine/Subutex',
      'Cocaïne',
      'Crack',
      'Cannabis',
      'Héroïne',
      'Lyrica',
      'Méthadone',
      'Moscantin/Skénan',
      'Tabac',
      'Tramadol',
    ],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: 'vulnerabilities',
    label: 'Vulnérabilités',
    type: 'multi-choice',
    options: ['Pathologie chronique', 'Psychologique', 'Injecteur', 'Handicap'],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: 'caseHistoryTypes',
    label: "Catégorie d'antécédents",
    type: 'multi-choice',
    options: [
      'Psychiatrie',
      'Neurologie',
      'Dermatologie',
      'Pulmonaire',
      'Gastro-enterologie',
      'Rhumatologie',
      'Cardio-vasculaire',
      'Ophtalmologie',
      'ORL',
      'Dentaire',
      'Traumatologie',
      'Endocrinologie',
      'Uro-gynéco',
      'Cancer',
      'Addiction alcool',
      'Addiction autres',
      'Hospitalisation',
    ],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: 'caseHistoryDescription',
    label: 'Informations complémentaires (antécédents)',
    type: 'textarea',
    options: null,
    enabled: true,
    required: false,
    showInStats: true,
  },
];

export const personFieldsIncludingCustomFieldsSelector = selector({
  key: 'personFieldsIncludingCustomFieldsSelector',
  get: ({ get }) => {
    const fieldsPersonsCustomizableOptions = get(fieldsPersonsCustomizableOptionsSelector);
    const customFieldsPersonsSocial = get(customFieldsPersonsSocialSelector);
    const customFieldsPersonsMedical = get(customFieldsPersonsMedicalSelector);
    return [
      ...personFields,
      ...[...fieldsPersonsCustomizableOptions, ...customFieldsPersonsMedical, ...customFieldsPersonsSocial].map((f) => {
        return {
          name: f.name,
          type: f.type,
          label: f.label,
          encrypted: true,
          importable: true,
          options: f.options || null,
        };
      }),
    ];
  },
});

/*
Choices on selects
*/

export const reasonsOptions = [
  "Sortie d'hébergement",
  'Expulsion de logement/hébergement',
  "Départ du pays d'origine",
  'Départ de région',
  'Rupture familiale',
  "Perte d'emploi",
  "Sortie d'hospitalisation",
  'Problème de santé',
  "Sortie d'ASE",
  'Sortie de détention',
  'Rupture de soins',
  'Autre',
];

export const ressourcesOptions = [
  'SANS',
  'ARE',
  'RSA',
  'AAH',
  'ADA',
  'ATA',
  'Retraite',
  'Salaire',
  'Allocation Chômage',
  'Indemnités journalières',
  'Mendicité',
  'Aide financière CCAS',
  'Revenus de Formations',
  "Pension d'invalidité",
  "Contrat d'engagement jeune",
  'Contrat jeune majeur',
  'Autre',
];
export const addressDetailsFixedFields = [
  'Logement',
  'Hébergement association',
  'Chez un tiers',
  "Mise à l'abri",
  'Logement accompagné',
  'Urgence',
  'Insertion',
  'Hôtel',
];

export const addressDetails = [...addressDetailsFixedFields, 'Autre'];

export const healthInsuranceOptions = ['Aucune', 'Régime Général', 'PUMa', 'AME', 'CSS', 'Autre'];

export const employmentOptions = ['DPH', 'CDD', 'CDDI', 'CDI', 'Interim', 'Bénévolat', 'Sans activité', 'Étudiant', 'Non déclaré', 'Autre'];

export const personalSituationOptions = ['Aucune', 'Homme isolé', 'Femme isolée', 'En couple', 'Famille', 'Famille monoparentale', 'Autre'];

export const genderOptions = ['Aucun', 'Homme', 'Femme', 'Homme transgenre', 'Femme transgenre', 'Non binaire', 'Autre'];

export const nationalitySituationOptions = ['Hors UE', 'UE', 'Française', 'Apatride'];

export const yesNoOptions = ['Oui', 'Non'];

export const outOfActiveListReasonOptions = [
  'Relai vers autre structure',
  'Hébergée',
  'Décès',
  'Incarcération',
  'Départ vers autre région',
  'Perdu de vue',
  'Hospitalisation',
  'Reconduite à la frontière',
  'Autre',
];

const fieldsPersonsCustomizableOptions = [
  {
    name: 'outOfActiveListReason',
    type: 'enum',
    label: 'Motif de sortie de file active',
    options: outOfActiveListReasonOptions,
    showInStats: true,
    enabled: true,
  },
];

/*

Utils

*/

export const personFields = [
  { name: 'user', type: 'text', label: '', encrypted: true, importable: false, filterable: false },
  { name: 'name', type: 'text', label: 'Nom prénom ou Pseudonyme', encrypted: true, importable: true, filterable: true },
  { name: 'otherNames', type: 'text', label: 'Autres pseudos', encrypted: true, importable: true, filterable: true },
  { name: 'gender', type: 'enum', label: 'Genre', encrypted: true, importable: true, options: genderOptions, filterable: true },
  { name: 'birthdate', type: 'date', label: 'Date de naissance', encrypted: true, importable: true, filterable: true },
  { name: 'description', type: 'textarea', label: 'Description', encrypted: true, importable: true, filterable: true },
  { name: 'alertness', type: 'boolean', label: 'Personne très vulnérable', encrypted: true, importable: true, filterable: true },
  { name: 'wanderingAt', type: 'date', label: 'En rue depuis le', encrypted: true, importable: true, filterable: true },
  {
    name: 'personalSituation',
    type: 'enum',
    label: 'Situation personnelle',
    encrypted: true,
    importable: true,
    options: personalSituationOptions,
    filterable: true,
  },
  {
    name: 'nationalitySituation',
    type: 'enum',
    label: 'Nationalité',
    encrypted: true,
    importable: true,
    options: nationalitySituationOptions,
    filterable: true,
  },
  { name: 'hasAnimal', type: 'yes-no', label: 'Avec animaux', encrypted: true, importable: true, options: yesNoOptions, filterable: true },
  { name: 'structureSocial', type: 'text', label: 'Structure de suivi social', encrypted: true, importable: true, filterable: true },
  { name: 'structureMedical', type: 'text', label: 'Structure de suivi médical', encrypted: true, importable: true, filterable: true },
  { name: 'employment', type: 'enum', label: 'Emploi', encrypted: true, importable: true, options: employmentOptions, filterable: true },
  { name: 'address', type: 'yes-no', label: 'Hébergement', encrypted: true, importable: true, options: yesNoOptions, filterable: true },
  {
    name: 'addressDetail',
    type: 'enum',
    label: "Type d'hébergement",
    encrypted: true,
    options: [...addressDetailsFixedFields, 'Autre'],
    importable: true,
    filterable: true,
  },
  { name: 'resources', type: 'multi-choice', label: 'Ressources', encrypted: true, importable: true, options: ressourcesOptions, filterable: true },
  {
    name: 'reasons',
    type: 'multi-choice',
    label: 'Motif de la situation en rue',
    encrypted: true,
    importable: true,
    options: reasonsOptions,
    filterable: true,
  },
  {
    name: 'healthInsurance',
    type: 'enum',
    label: 'Couverture médicale',
    encrypted: true,
    importable: true,
    options: healthInsuranceOptions,
    filterable: true,
  },

  { name: 'phone', type: 'text', label: 'Téléphone', encrypted: true, importable: true, filterable: true },
  { name: 'assignedTeams', type: 'multi-choice', label: 'Équipes en charge', encrypted: true, importable: true, filterable: false },
  { name: '_id', label: '', encrypted: false, importable: false, filterable: false },
  { name: 'organisation', label: '', encrypted: false, importable: false, filterable: false },
  { name: 'followedSince', type: 'date', label: 'Suivi(e) depuis le / Créé(e) le', encrypted: true, importable: true, filterable: true },
  { name: 'createdAt', type: 'date', label: '', encrypted: false, importable: false, filterable: false },
  { name: 'updatedAt', type: 'date', label: '', encrypted: false, importable: false, filterable: false },
  {
    name: 'outOfActiveList',
    type: 'yes-no',
    label: 'Sortie de file active',
    encrypted: true,
    importable: false,
    options: yesNoOptions,
    filterable: true,
  },
  { name: 'outOfActiveListDate', type: 'date', label: '', encrypted: true, importable: false, filterable: false },
  { name: 'documents', type: 'files', label: 'Documents', encrypted: true, importable: false, filterable: false },
  { name: 'history', type: 'history', label: 'Historique', encrypted: true, importable: false, filterable: false },
];

export const encryptedFields = personFields.filter((f) => f.encrypted).map((f) => f.name);
export const preparePersonForEncryption = (customFieldsMedical, customFieldsSocial) => (person) => {
  const encryptedFieldsIncludingCustom = [
    ...customFieldsSocial.map((f) => f.name),
    ...customFieldsMedical.map((f) => f.name),
    ...fieldsPersonsCustomizableOptions.map((f) => f.name),
    ...encryptedFields,
    'actions',
    'comments',
    'passages',
    'rencontres',
  ];
  const decrypted = {};
  for (let field of encryptedFieldsIncludingCustom) {
    decrypted[field] = person[field];
  }
  return {
    _id: person._id,
    organisation: person.organisation,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    outOfActiveList: person.outOfActiveList,

    decrypted,
    entityKey: person.entityKey,
  };
};

export const filterPersonsBase = personFields.filter((m) => m.filterable).map(({ name, ...rest }) => ({ field: name, ...rest }));
