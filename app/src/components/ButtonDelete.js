import React from 'react';
import Button from './Button';
import colors from '../utils/colors';

const ButtonDelete = ({ onPress, caption = 'Supprimer' }) => (
  <Button caption={caption} onPress={onPress} color={colors.delete.color} outlined />
);

export default ButtonDelete;
