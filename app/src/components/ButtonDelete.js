import React from 'react';
import Button from './Button';
import colors from '../utils/colors';

const ButtonDelete = ({ onPress, caption = 'Supprimer', deleting }) => (
  <Button caption={caption} onPress={onPress} color={colors.delete.color} outlined disabled={deleting} loading={deleting} />
);

export default ButtonDelete;
