import React from 'react';
import MultiCheckBoxes from './MultiCheckBoxes';
import { useRecoilValue } from 'recoil';
import { flattenedTerritoriesTypesSelector } from '../../recoil/territory';

const TerritoryMultiCheckBoxes = ({ values = [], onChange, editable }) => {
  const territoryTypes = useRecoilValue(flattenedTerritoriesTypesSelector);
  return (
    <MultiCheckBoxes label="Type" source={territoryTypes} values={values} onChange={onChange} editable={editable} emptyValue="-- Choisissez --" />
  );
};

export default TerritoryMultiCheckBoxes;
