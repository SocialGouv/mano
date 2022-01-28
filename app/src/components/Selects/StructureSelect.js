import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import API from '../../services/api';
import SelectLabelled from './SelectLabelled';

export const initStructure = {
  _id: null,
  name: '-- Aucune --',
};

const StructureSelect = ({ value, onSelect, editable }) => {
  const [structures, setStructures] = useState([initStructure]);
  const [key, setKey] = useState(0);

  const getStructures = async () => {
    const response = await API.get({ path: '/structure' });
    if (response.error) return Alert.alert(response.error);
    const structures = response.data;
    structures.unshift(initStructure);
    setStructures(structures);
    setKey((k) => k + 1);
  };

  useEffect(() => {
    getStructures();
  }, []);

  return (
    <SelectLabelled
      key={key}
      label="Structure"
      mappedIdsToLabels={structures}
      values={structures.map((s) => s._id)}
      value={value}
      onSelect={onSelect}
      editable={editable}
    />
  );
};

export default StructureSelect;
