import { atom } from 'recoil';

export const territoriesState = atom({
  key: 'territoriesState',
  default: [],
});

const encryptedFields = ['name', 'perimeter', 'types', 'user', 'observations'];

export const prepareTerritoryForEncryption = (territory) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = territory[field];
  }
  return {
    _id: territory._id,
    createdAt: territory.createdAt,
    updatedAt: territory.updatedAt,
    organisation: territory.organisation,

    decrypted,
    entityKey: territory.entityKey,
  };
};

export const territoryTypes = [
  'Lieu de conso',
  'Lieu de deal',
  'Carrefour de passage',
  'Campement',
  'Lieu de vie',
  'Prostitution',
  'Errance',
  'Mendicité',
  'Loisir',
  'Rassemblement communautaire',
  'Historique',
];
