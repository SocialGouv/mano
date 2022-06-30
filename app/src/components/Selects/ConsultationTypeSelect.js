import React from 'react';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../../recoil/auth';
import SelectLabelled from './SelectLabelled';

const ConsultationTypeSelect = ({ value, onSelect, editable }) => {
  const organisation = useRecoilValue(organisationState);
  const types = ['-- Choisissez un type  --', ...organisation.consultations.map((t) => t.name)];
  if (!value?.length) value = types[0];
  return <SelectLabelled label="Motif de sortie de file active" values={types} value={value} onSelect={onSelect} editable={editable} />;
};

export default ConsultationTypeSelect;
