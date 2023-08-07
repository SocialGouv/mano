import React from 'react';
import Button from './Button';
import colors from '../utils/colors';

const ButtonDelete = ({ onPress, caption = 'Supprimer', deleting }) => (
  <Button
    caption={caption}
    onPress={onPress}
    backgroundColor={colors.delete.backgroundColor}
    color={colors.delete.color}
    disabled={deleting}
    loading={deleting}
  />
);

export default ButtonDelete;
