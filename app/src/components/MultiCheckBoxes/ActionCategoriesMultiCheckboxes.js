import React from 'react';
import { useRecoilValue } from 'recoil';
import { organisationState } from '../../recoil/auth';
import MultiCheckBoxes from './MultiCheckBoxes';

const ActionCategoriesMultiCheckboxes = ({ values = [], onChange, editable }) => {
  const organisation = useRecoilValue(organisationState);
  const categories = organisation.categories || [];
  return (
    <MultiCheckBoxes label="Catégories" source={categories} values={values} onChange={onChange} editable={editable} emptyValue="-- Choisissez --" />
  );
};

export default ActionCategoriesMultiCheckboxes;
