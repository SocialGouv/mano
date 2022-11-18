import { setCacheItem } from '../services/dataManagement';
import { atom, selectorFamily } from 'recoil';

const collectionName = 'group';
export const groupsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

export const groupSelector = selectorFamily({
  key: 'groupSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const groups = get(groupsState);
      return groups.find((group) => group?.persons?.includes?.(personId)) || { persons: [], relations: [] };
    },
});

const encryptedFields = ['persons', 'relations'];

// @type Relation: { persons: uuid[], description: string, createdAt: Date, updatedAt: Date, user: uuid };

export const prepareGroupForEncryption = (report) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = report[field];
  }
  return {
    _id: report._id,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    organisation: report.organisation,

    decrypted,
    entityKey: report.entityKey,
  };
};

// copilot started working...

// export const relations = [
//   { _id: 'papa', label: 'Papa', labelledRelation: 'est le papa de' },
//   { _id: 'maman', label: 'Maman', labelledRelation: 'est la maman de' },
//   { _id: 'parent', label: 'Parent', labelledRelation: 'est le parent de' },
//   { _id: 'fils', label: 'Fils', labelledRelation: 'est le fils de' },
//   { _id: 'fille', label: 'Fille', labelledRelation: 'est la fille de' },
//   { _id: 'enfant', label: 'Enfant', labelledRelation: "est l'enfant de" },
//   { _id: 'conjoint', label: 'Conjoint', labelledRelation: 'est le conjoint de' },
//   { _id: 'mari', label: 'Mari', labelledRelation: 'est le mari de' },
//   { _id: 'femme', label: 'Femme', labelledRelation: 'est la femme de' },
//   { _id: 'frere', label: 'Frère', labelledRelation: 'est le frère de' },
//   { _id: 'soeur', label: 'Sœur', labelledRelation: 'est la sœur de' },
//   { _id: 'frere-soeur', label: 'Frère/Soeur', labelledRelation: 'est le frère/la soeur de' },
//   { _id: 'cousin', label: 'Cousin', labelledRelation: 'est un cousin de' },
//   { _id: 'cousine', label: 'Cousin', labelledRelation: 'est une cousine de' },
//   { _id: 'oncle', label: 'Oncle', labelledRelation: "est l'oncle de" },
//   { _id: 'tante', label: 'Tante', labelledRelation: 'est la tante de' },
//   { _id: 'oncle-tante', label: 'Oncle/Tante', labelledRelation: 'est l'oncle/la tante de' },
//   { _id: 'neveu', label: 'Neveu', labelledRelation: 'est le neveu de' },
//   { _id: 'niece', label: 'Nièce', labelledRelation: 'est la nièce de' },
//   { _id: 'neveu-niece', label: 'Neveu/Nièce', labelledRelation: 'est le/la neveu/nièce de' },
//   { _id: 'grand-pere', label: 'Grand-père', labelledRelation: 'est le grand-père de' },
//   { _id: 'grand-mere', label: 'Grand-mère', labelledRelation: 'est la grand-mère de' },
//   { _id: 'grand-parent', label: 'Grand-parent', labelledRelation: 'est le grand-parent de' },
//   { _id: 'petit-fils', label: 'Petit-fils', labelledRelation: 'est un petit-fils de' },
//   { _id: 'petite-fille', label: 'Petite-fille', labelledRelation: 'est une petite-fille de' },
//   { _id: 'petit-enfant', label: 'Petit-enfant', labelledRelation: 'est un petit-enfant de' },
//   { _id: 'parrain', label: 'Parrain', labelledRelation: 'est le parrain de' },
//   { _id: 'marraine', label: 'Marraine', labelledRelation: 'est la marraine de' },
//   { _id: 'parrain-marraine', label: 'Parrain/Marraine', labelledRelation: 'est le/la parrain/marraine de' },
//   { _id: 'filleul', label: 'Filleul', labelledRelation: 'est le filleul de' },
//   { _id: 'filleule', label: 'Filleule', labelledRelation: 'est la filleule de' },
//   { _id: 'filleul-e', label: 'Filleul(e)', labelledRelation: 'est le/la filleul(e) de' },
//   { _id: 'ami', label: 'Ami', labelledRelation: "est un ami de" },
//   { _id: 'amie', label: 'Ami', labelledRelation: "est une amie de" },
//   { _id: 'ami-e', label: 'Ami', labelledRelation: "est un(e) ami(e) de" },
//   { _id: 'autre', label: 'Autre' },
// ];

// const autoRelations = (person1, relationId, person2) => {
//   switch (relationId) {
//     case 'papa':
//     case 'maman':
//     case 'parent':
//       if (person2.gender.includes('Homme')) return [person2._id, 'fils', person1._id];
//       if (person2.gender.includes('Femme')) return [person2._id, 'fille', person1._id];
//       return [person2._id, 'enfant', person1._id];
//     case 'fils':
//     case 'fille':
//     case 'enfant':
//       if (person2.gender.includes('Homme')) return [person2._id, 'papa', person1._id];
//       if (person2.gender.includes('Femme')) return [person2._id, 'maman', person1._id];
//       return [person2._id, 'parent', person1._id];
//     case 'conjoint':
//       return [person2._id, 'conjoint', person1._id];
//     case 'mari':
//       return [person2._id, 'femme', person1._id];
//     case 'femme':
//       return [person2._id, 'mari', person1._id];
//     case 'frere':
//     case 'soeur':
//     case 'frere-soeur':
//       if (person2.gender.includes('Femme')) return [person2._id, 'soeur', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'frere', person1._id];
//       return [person2._id, 'frere-soeur', person1._id];
//     case 'cousin':
//     case 'cousine':
//       if (person2.gender.includes('Femme')) return [person2._id, 'cousine', person1._id];
//       return [person2._id, 'cousin', person1._id];
//     case 'oncle':
//     case 'tante':
//       if (person2.gender.includes('Femme')) return [person2._id, 'niece', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'neveu', person1._id];
//       return [person2._id, 'neveu-niece', person1._id];
//     case 'neveu':
//     case 'niece':
//     case 'neveu-niece':
//       if (person2.gender.includes('Femme')) return [person2._id, 'tante', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'oncle', person1._id];
//       return [person2._id, 'oncle-tante', person1._id];
//     case 'grand-pere':
//     case 'grand-mere':
//     case 'grand-parent':
//       if (person2.gender.includes('Femme')) return [person2._id, 'petite-fille', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'petit-fils', person1._id];
//       return [person2._id, 'petit-enfant', person1._id];
//     case 'petit-fils':
//     case 'petite-fille':
//     case 'petit-enfant':
//       if (person2.gender.includes('Femme')) return [person2._id, 'grand-mere', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'grand-pere', person1._id];
//       return [person2._id, 'grand-parent', person1._id];
//     case 'parrain':
//     case 'marraine':
//     case 'parrain-marraine':
//       if (person2.gender.includes('Femme')) return [person2._id, 'filleule', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'filleul', person1._id];
//       return [person2._id, 'filleul-e', person1._id];
//     case 'filleul':
//     case 'filleule':
//     case 'filleul-e':
//       if (person2.gender.includes('Femme')) return [person2._id, 'marraine', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'parrain', person1._id];
//       return [person2._id, 'parrain-marraine', person1._id];
//     case 'ami';
//     case 'amie';
//     case 'ami-e':
//       if (person2.gender.includes('Femme')) return [person2._id, 'amie', person1._id];
//       if (person2.gender.includes('Homme')) return [person2._id, 'ami', person1._id];
//       return [person2._id, 'ami-e', person1._id];
//     default:
//       return null;
//   }
//   }
