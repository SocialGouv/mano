/* eslint-disable react-hooks/exhaustive-deps */
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';
import { useComments } from '../recoil/comments';
import useApi from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import { useActions } from './actions';
import { organisationState } from './auth';
import { useRelsPerson } from './relPersonPlace';

export const personsState = atom({
  key: 'personsState',
  default: [],
});

export const personsLoadingState = atom({
  key: 'personsLoadingState',
  default: true,
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

export const usePersons = () => {
  const { comments, addComment, deleteComment } = useComments();
  const { deleteAction, actions } = useActions();
  const { relsPersonPlace, deleteRelation } = useRelsPerson();
  const API = useApi();

  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);

  const [persons, setPersons] = useRecoilState(personsState);
  const [loading, setLoading] = useRecoilState(personsLoadingState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-persons', 0);

  const setPersonsFullState = (newPersons) => {
    if (newPersons) setPersons(newPersons.sort(sortPersons));
    setLoading(false);
    setLastRefresh(Date.now());
  };

  const setBatchData = (newPersons) => setPersons((persons) => [...persons, ...newPersons]);

  const refreshPersons = async (setProgress, initialLoad = false) => {
    setLoading(true);
    try {
      setPersonsFullState(
        await getData({
          collectionName: 'person',
          data: persons,
          isInitialization: initialLoad,
          setProgress,
          lastRefresh,
          setBatchData,
          API,
        })
      );
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      setLoading(false);
      return false;
    }
  };

  const deletePerson = async (id) => {
    const res = await API.delete({ path: `/person/${id}` });
    if (res.ok) {
      setPersons((persons) => persons.filter((p) => p._id !== id));
      for (const action of actions.filter((a) => a.person === id)) {
        await deleteAction(action._id, { ignoreError: true });
      }
      for (let comment of comments.filter((c) => c.person === id)) {
        await deleteComment(comment._id, { ignoreError: true });
      }
      for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === id)) {
        await deleteRelation(relPersonPlace._id, { ignoreError: true });
      }
    }
    return res;
  };

  const addPerson = async (person) => {
    try {
      const existingPerson = persons.find((p) => p.name === person.name);
      if (existingPerson) return { ok: false, error: 'Un utilisateur existe déjà à ce nom' };
      const response = await API.post({
        path: '/person',
        body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(person),
      });
      if (response.ok) {
        setPersons((persons) => [response.decryptedData, ...persons].sort(sortPersons));
      }
      return response;
    } catch (error) {
      capture('error in creating person' + error, { extra: { error, person } });
      return { ok: false, error: error.message };
    }
  };
  const uploadDocument = async (file, person) => {
    try {
      const response = await API.upload({
        path: `/person/${person._id}/document`,
        file: file,
      });
      return response;
    } catch (error) {
      capture('error in uploading document: ' + error, { extra: { error, document } });
      return { ok: false, error: error.message };
    }
  };
  const downloadDocument = async (person, document) => {
    try {
      const file = await API.download({
        path: `/person/${person._id}/document/${document.file.filename}`,
        encryptedEntityKey: document.encryptedEntityKey,
      });
      return file;
    } catch (error) {
      capture('error in downloading document: ' + error, { extra: { error, document } });
      return { ok: false, error: error.message };
    }
  };
  const deleteDocument = async (person, document) => {
    try {
      const response = await API.delete({
        path: `/person/${person._id}/document/${document.file.filename}`,
      });
      return response;
    } catch (error) {
      capture('error in deleting document: ' + error, { extra: { error, document } });
      return { ok: false, error: error.message };
    }
  };
  const updatePerson = async (person) => {
    try {
      const oldPerson = persons.find((a) => a._id === person._id);
      const response = await API.put({
        path: `/person/${person._id}`,
        body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(person),
      });
      if (response.ok) {
        const newPerson = response.decryptedData;
        setPersons((persons) =>
          persons.map((p) => {
            if (p._id === person._id) return newPerson;
            return p;
          })
        );
        const comment = commentForUpdatePerson({ newPerson, oldPerson });
        if (comment) {
          const response = await addComment(comment);
          if (!response.ok) {
            capture(response.error, {
              extra: { message: 'error in creating comment for person update', newPerson, comment },
            });
          }
        }
      }
      return response;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating person', person } });
      return { ok: false, error: error.message };
    }
  };

  const personFieldsIncludingCustomFields = (person) => {
    return [
      ...personFields,
      ...[...customFieldsPersonsMedical, ...customFieldsPersonsSocial].map((f) => {
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
  };

  return {
    persons,
    loading,
    personFieldsIncludingCustomFields,
    customFieldsPersonsSocial,
    customFieldsPersonsMedical,
    refreshPersons,
    deletePerson,
    addPerson,
    updatePerson,
    uploadDocument,
    downloadDocument,
    deleteDocument,
  };
};

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

export const vulnerabilitiesOptions = ['Pathologie chronique', 'Psychologique', 'Injecteur', 'Handicap'];

export const ressourcesOptions = [
  'SANS',
  'ARE',
  'RSA',
  'AAH',
  'ADA',
  'Retraite',
  'Salaire',
  'Allocation Chômage',
  'Indemnités journalières',
  'Mendicité',
  'Autre',
];

export const consumptionsOptions = [
  'Héroïne',
  'Buprénorphine/Subutex',
  'Méthadone',
  'Moscantin/Skénan',
  'Cocaïne',
  'Crack',
  'Amphétamine/MDMA/Ecstasy',
  'Benzodiazépines',
  'Cannabis',
  'Alcool',
  'Tabac',
  'Tramadol',
  'Lyrica',
].sort((c1, c2) => c1.localeCompare(c2));

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

export const personalSituationOptions = ['Aucune', 'Homme isolé', 'Femme isolée', 'En couple', 'Famille', 'Autre'];

export const genderOptions = ['Aucun', 'Homme', 'Femme', 'Autre'];

export const nationalitySituationOptions = ['Hors UE', 'UE', 'Française'];

export const yesNoOptions = ['Oui', 'Non'];

export const caseHistoryTypesOptions = [
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
];

export const outOfActiveListReasonOptions = [
  'Relai vers autre structure',
  'Hébergée',
  'Décès',
  'Incarcération',
  'Départ vers autre région',
  'Perdu de vue',
  'Hospitalisation',
  'Reconduite à la frontière',
];

export const defaultMedicalCustomFields = [
  {
    name: 'consumptions',
    label: 'Consommations',
    type: 'multi-choice',
    options: consumptionsOptions,
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: 'vulnerabilities',
    label: 'Vulnérabilités',
    type: 'multi-choice',
    options: vulnerabilitiesOptions,
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: 'caseHistoryTypes',
    label: "Catégorie d'antécédents",
    type: 'multi-choice',
    options: caseHistoryTypesOptions,
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
  { name: 'addressDetail', type: 'text', label: "Type d'hébergement", encrypted: true, importable: true, filterable: true },
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
  { name: 'createdAt', type: 'date', label: 'Suivi(e) depuis le / Créé le', encrypted: false, importable: true, filterable: true },
  { name: 'updatedAt', type: 'date', label: '', encrypted: false, importable: false, filterable: false },
  {
    name: 'outOfActiveList',
    type: 'yes-no',
    label: 'Sortie de file active',
    encrypted: false,
    importable: false,
    options: yesNoOptions,
    filterable: true,
  },
  {
    name: 'outOfActiveListReason',
    type: 'enum',
    label: 'Motif de sortie de file active',
    encrypted: true,
    importable: false,
    options: outOfActiveListReasonOptions,
  },
  { name: 'documents', type: 'files', label: 'Documents', encrypted: true, importable: false, filterable: false },
];

export const encryptedFields = personFields.filter((f) => f.encrypted).map((f) => f.name);
export const preparePersonForEncryption = (customFieldsMedical, customFieldsSocial) => (person) => {
  const encryptedFieldsIncludingCustom = [...customFieldsSocial.map((f) => f.name), ...customFieldsMedical.map((f) => f.name), ...encryptedFields];
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
    ...person,
  };
};

const sortPersons = (p1, p2) => p1.name.localeCompare(p2.name);

const commentForUpdatePerson = ({ newPerson, oldPerson }) => {
  try {
    const commentbody = {
      type: 'person',
      item: newPerson._id,
      person: newPerson._id,
    };
    const notifyChange = (field, before, now) => `Changement ${field}:
    Avant: ${before || 'Non renseigné'}
    Désormais: ${now}`;

    const fieldChanged = (field, stringifyForCheck = false) => {
      const next = stringifyForCheck ? JSON.stringify(newPerson[field]) : newPerson[field];
      const prev = stringifyForCheck ? JSON.stringify(oldPerson[field]) : oldPerson[field];
      if (!next && !prev) return false;
      if (!next && !prev) return false;
      if (!next && !!prev) return true;
      if (!!next && !prev) return true;
      if (next === prev) return false;
      return true;
    };

    let comment = [];

    if (fieldChanged('personalSituation')) {
      comment.push(notifyChange('de situation personnelle', oldPerson.personalSituation, newPerson.personalSituation));
    }
    if (fieldChanged('nationalitySituation')) {
      comment.push(notifyChange('de nationalité', oldPerson.nationalitySituation, newPerson.nationalitySituation));
    }
    if (fieldChanged('structureSocial')) {
      comment.push(notifyChange('de structure de suivi social', oldPerson.structureSocial, newPerson.structureSocial));
    }
    if (fieldChanged('structureMedical')) {
      comment.push(notifyChange('de structure de suivi médical', oldPerson.structureMedical, newPerson.structureMedical));
    }
    if (fieldChanged('employment')) {
      comment.push(notifyChange("d'emploi", oldPerson.employment, newPerson.employment));
    }
    if (fieldChanged('address') || fieldChanged('addressDetail')) {
      const prev = oldPerson.address === 'Oui' ? oldPerson.addressDetail : oldPerson.address;
      const next = newPerson.address === 'Oui' ? newPerson.addressDetail : newPerson.address;
      comment.push(notifyChange("d'hébergement", prev, next));
    }
    if (fieldChanged('resources', true)) {
      comment.push(notifyChange('de ressources', (oldPerson.resources || []).join(', '), (newPerson.resources || []).join(', ')));
    }
    if (fieldChanged('healthInsurance')) {
      comment.push(notifyChange('de couverture médicale', oldPerson.healthInsurance, newPerson.healthInsurance));
    }

    if (comment.length) {
      return {
        ...commentbody,
        comment: comment.join('\n'),
      };
    }
  } catch (error) {
    capture(error, {
      extra: {
        message: 'error in formatting comment for update person',
        newPerson,
        oldPerson,
      },
    });
  }
  return null;
};

export const filterPersonsBase = personFields.filter((m) => m.filterable).map(({ label, name, options }) => ({ label, field: name, options }));
