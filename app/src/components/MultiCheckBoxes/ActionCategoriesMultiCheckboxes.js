import React from 'react';
import AuthContext from '../../contexts/auth';
import withContext from '../../contexts/withContext';
import MultiCheckBoxes from './MultiCheckBoxes';

const ActionCategoriesMultiCheckboxes = ({ values = [], onChange, editable, context }) => {
  const categories = (context.organisation.categories || []).sort((c1, c2) => c1.localeCompare(c2));
  return (
    <MultiCheckBoxes label="Catégories" source={categories} values={values} onChange={onChange} editable={editable} emptyValue="-- Choisissez --" />
  );
};

export default withContext(AuthContext)(ActionCategoriesMultiCheckboxes);
