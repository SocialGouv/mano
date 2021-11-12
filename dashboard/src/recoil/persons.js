/* eslint-disable react-hooks/exhaustive-deps */
import { atom, useRecoilState } from 'recoil';
import { useComments } from '../recoil/comments';
import useApi from '../services/api-interface-with-dashboard';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import { useActions } from './actions';
import { useRelsPerson } from './relPersonPlace';

export const personsState = atom({
  key: 'personsState',
  default: [],
});

export const personsLoadingState = atom({
  key: 'personsLoadingState',
  default: true,
});

export const usePersons = () => {
  const { comments, addComment, deleteComment } = useComments();
  const { deleteAction, actions } = useActions();
  const { relsPersonPlace, deleteRelation } = useRelsPerson();
  const API = useApi();

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
        await deleteAction(action._id);
      }
      for (let comment of comments.filter((c) => c.person === id)) {
        await deleteComment(comment._id);
      }
      for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === id)) {
        await deleteRelation(relPersonPlace._id);
      }
    }
    return res;
  };

  const addPerson = async (person) => {
    try {
      const existingPerson = persons.find((p) => p.name === person.name);
      if (existingPerson) return { ok: false, error: 'Un utilisateur existe déjà à ce nom' };
      const response = await API.post({ path: '/person', body: preparePersonForEncryption(person) });
      if (response.ok) {
        setPersons((persons) => [response.decryptedData, ...persons].sort(sortPersons));
      }
      return response;
    } catch (error) {
      capture('error in creating person' + error, { extra: { error, person } });
      return { ok: false, error: error.message };
    }
  };
  const updatePerson = async (person) => {
    try {
      const oldPerson = persons.find((a) => a._id === person._id);
      const response = await API.put({
        path: `/person/${person._id}`,
        body: preparePersonForEncryption(person),
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

  return {
    persons,
    loading,
    refreshPersons,
    deletePerson,
    addPerson,
    updatePerson,
  };
};

/*

Utils

*/

const encryptedFields = [
  'user',
  'name',
  'otherNames',
  'gender',
  'birthdate',
  'description',
  'alertness',
  'wanderingAt',
  'personalSituation',
  'nationalitySituation',
  'hasAnimal',
  'structureSocial',
  'structureMedical',
  'employment',
  'address',
  'addressDetail',
  'resources',
  'reasons',
  'healthInsurance',
  'vulnerabilities',
  'consumptions',
  'phone',
  'assignedTeams',
];

export const preparePersonForEncryption = (person) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = person[field];
  }
  return {
    _id: person._id,
    organisation: person.organisation,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,

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
];

export const addressDetails = [...addressDetailsFixedFields, 'Autre'];

export const healthInsuranceOptions = ['Aucune', 'Régime Général', 'PUMa', 'AME', 'CSS', 'Autre'];

export const employmentOptions = ['DPH', 'CDD', 'CDDI', 'CDI', 'Interim', 'Bénévolat', 'Sans activité', 'Étudiant', 'Non déclaré', 'Autre'];

export const personalSituationOptions = ['Aucune', 'Homme isolé', 'Femme isolée', 'En couple', 'Famille', 'Autre'];

export const genderOptions = ['Aucun', 'Homme', 'Femme', 'Autre'];

export const nationalitySituationOptions = ['Hors UE', 'UE', 'Française'];

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
];

export const filterPersonsBase = [
  {
    label: 'Genre',
    field: 'gender',
    options: genderOptions,
  },
  {
    label: 'Consommations',
    field: 'consumptions',
    options: consumptionsOptions,
  },
  {
    label: 'Couverture médicale',
    field: 'healthInsurance',
    options: healthInsuranceOptions,
  },
  {
    label: 'Nationalité',
    field: 'nationalitySituation',
    options: nationalitySituationOptions,
  },
  {
    label: 'Situation personnelle',
    field: 'personalSituation',
    options: personalSituationOptions,
  },
  {
    label: 'Ressources',
    field: 'resources',
    options: ressourcesOptions,
  },
  {
    label: 'Motifs de la situation de rue',
    field: 'reasons',
    options: reasonsOptions,
  },
  {
    label: 'Emploi',
    field: 'employment',
    options: employmentOptions,
  },
  {
    label: 'Vulnérabilités',
    field: 'vulnerabilities',
    options: vulnerabilitiesOptions,
  },
  {
    label: 'Hébergement',
    field: 'address',
    options: yesNoOptions,
  },
  {
    label: 'Avec animaux',
    field: 'hasAnimal',
    options: yesNoOptions,
  },
  {
    label: 'Sortie de file active',
    field: 'outOfActiveList',
    options: yesNoOptions,
  },
  {
    label: 'Motif de sortie de file active',
    field: 'outOfActiveListReason',
    options: outOfActiveListReasonOptions,
  },
];
