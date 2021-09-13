import React from 'react';
import MultiCheckBoxes from './MultiCheckBoxes';

// prettier-ignore
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

const TerritoryMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  return (
    <MultiCheckBoxes label="Type" source={territoryTypes} values={values} onChange={onChange} editable={editable} emptyValue="-- Choisissez --" />
  );
};

export default TerritoryMultiCheckBoxes;
